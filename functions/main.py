# functions/main.py

# --- Imports ESTRICTAMENTE necesarios globalmente ---
from firebase_functions import https_fn, scheduler_fn
from firebase_admin import initialize_app, firestore, auth
import os
import json
import traceback
import pytz # --- CORRECCIÓN 1.3: Importamos pytz para manejar zonas horarias ---
import datetime # --- CORRECCIÓN 3.2: Importamos datetime para el cálculo de la semana ---
from dateutil import rrule, parser as date_parser

# Inicializar Firebase (solo una vez, es ligero)
initialize_app()

# --- CACHÉ GLOBAL (Inicializados a None) ---
# Models
preprocessor_kmeans = None
kmeans_model = None
preprocessor_regression = None
regression_model = None
# Clients
db_client = None
storage_client = None
vision_model = None
# Flags
vertexai_initialized = False

# --- CONFIGURACIÓN DE GCS ---
GCS_BUCKET_NAME = 'agenda-b616a-models'
KMEANS_PREPROCESSOR_GCS = 'preprocessor_kmeans.pkl'
KMEANS_MODEL_GCS = 'modelo_kmeans_4clusters.pkl'
REGRESSION_PREPROCESSOR_GCS = 'preprocessor_regresion.pkl'
REGRESSION_MODEL_GCS = 'modelo_regresion_aprobacion.pkl'
# Rutas locales temporales
KMEANS_PREPROCESSOR_LOCAL = '/tmp/preprocessor_kmeans.pkl'
KMEANS_MODEL_LOCAL = '/tmp/modelo_kmeans_4clusters.pkl'
REGRESSION_PREPROCESSOR_LOCAL = '/tmp/preprocessor_regresion.pkl'
REGRESSION_MODEL_LOCAL = '/tmp/modelo_regresion_aprobacion.pkl'

# --- Colores predeterminados ---
presetColors = ["#46487A","#7786C6","#D9534F","#F0AD4E","#FFC212","#5CB85C","#5BC0DE","#F9B0C3","#6C757D","#343A40"]

# ===============================================================
#  FUNCIÓN HELPER: DESCARGAR DE GCS
# ===============================================================
def download_blob(bucket_name, source_blob_name, destination_file_name):
    """Descarga un archivo desde GCS al sistema de archivos temporal /tmp/."""
    from google.cloud import storage
    global storage_client
    
    if storage_client is None:
        try:
            print("🔄 Inicializando cliente GCS...")
            storage_client = storage.Client()
            print("✅ Cliente GCS inicializado.")
        except Exception as gcs_init_e:
            print(f"❌ Error FATAL inicializando GCS: {gcs_init_e}")
            raise
    
    try:
        bucket = storage_client.bucket(bucket_name)
        blob = bucket.blob(source_blob_name)
        os.makedirs(os.path.dirname(destination_file_name), exist_ok=True)
        print(f"⬇️ Descargando {source_blob_name} de gs://{bucket_name} a {destination_file_name}...")
        blob.download_to_filename(destination_file_name)
        print(f"✅ Descarga GCS completada: {destination_file_name}")
    except Exception as e:
        print(f"❌ Error descargando {source_blob_name} de GCS: {e}")
        raise

# ===============================================================
#  FUNCIÓN HELPER: TRADUCIR CLAVES (Formulario -> Modelo)
# ===============================================================
KEY_MAPPER = {
    'promedioEstudio': 'study_hours_per_day', 'redesSociales': 'social_media_hours',
    'streaming': 'netflix_hours', 'asistencia': 'attendance_percentage',
    'horasSueno': 'sleep_hours', 'diasEjercicio': 'exercise_frequency',
    'calidadDieta': 'diet_quality', 'educacionPadres': 'parental_education_level',
    'saludMental': 'mental_health_rating', 'actividadesExtra': 'extracurricular_participation',
    'cargaAcademica': 'academic_load', 'metodoEstudio': 'study_method',
    'motivacion': 'motivation_level', 'usaHerramientas': 'time_management_tools',
    'nivelEstres': 'stress_level', 'trabaja': 'part_time_job'
}

def translate_keys(data_dict):
    """Traduce claves de Español a Inglés y convierte tipos numéricos."""
    translated_data = {}
    if not isinstance(data_dict, dict):
        print("WARN: translate_keys recibió algo que no es un diccionario.")
        return translated_data
    
    for key_es, value in data_dict.items():
        key_en = KEY_MAPPER.get(key_es, key_es)
        if isinstance(value, str):
            try:
                # --- CORRECCIÓN 2.1b: Aseguramos que los 'required' numéricos se conviertan ---
                # Si el frontend (por error) envía un número como string (ej: "5"), 
                # lo convertimos a float, EXCEPTO los que son Sí/No.
                if value not in ['Sí', 'No', 'Si'] and key_es not in ['genero', 'calidadDieta', 'educacionPadres', 'metodoEstudio']:
                    translated_data[key_en] = float(value)
                else:
                    translated_data[key_en] = value
            except ValueError:
                translated_data[key_en] = value
        else:
            translated_data[key_en] = value

    # Normalizar Sí/No a 'Si'/'No'
    bool_keys_spanish_tilde = {
        'extracurricular_participation': 'actividadesExtra',
        'part_time_job': 'trabaja',
        'time_management_tools': 'usaHerramientas'
    }
    
    for key_en, key_es in bool_keys_spanish_tilde.items():
        if key_en in translated_data:
            original_value = data_dict.get(key_es)
            translated_data[key_en] = 'Si' if original_value == 'Sí' else 'No'
    
    return translated_data

# ===============================================================
#  FUNCIÓN 1: PREDECIR PERFIL DE ESTUDIANTE (K-MEANS)
# ===============================================================
@https_fn.on_request(memory=512)
def predict_student_profile(req: https_fn.Request) -> https_fn.Response:
    """Recibe datos del cuestionario (JSON), predice clúster K-Means y devuelve JSON."""
    import joblib
    import pandas as pd
    global preprocessor_kmeans, kmeans_model

    # --- Manejo CORS ACTUALIZADO para Cloud Run ---
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '3600'
    }
    
    if req.method == 'OPTIONS':
        return https_fn.Response("", headers=headers, status=204)
    
    headers['Content-Type'] = 'application/json'
    # --- Fin CORS ---

    # --- Carga perezosa de modelos desde GCS ---
    try:
        if preprocessor_kmeans is None:
            if not os.path.exists(KMEANS_PREPROCESSOR_LOCAL):
                download_blob(GCS_BUCKET_NAME, KMEANS_PREPROCESSOR_GCS, KMEANS_PREPROCESSOR_LOCAL)
            print(f"🔄 Cargando preprocesador K-Means desde {KMEANS_PREPROCESSOR_LOCAL}...")
            preprocessor_kmeans = joblib.load(KMEANS_PREPROCESSOR_LOCAL)
            print("✅ Preprocesador K-Means cargado.")
        
        if kmeans_model is None:
            if not os.path.exists(KMEANS_MODEL_LOCAL):
                download_blob(GCS_BUCKET_NAME, KMEANS_MODEL_GCS, KMEANS_MODEL_LOCAL)
            print(f"🔄 Cargando modelo K-Means desde {KMEANS_MODEL_LOCAL}...")
            kmeans_model = joblib.load(KMEANS_MODEL_LOCAL)
            print("✅ Modelo K-Means cargado.")
    except Exception as e:
        print(f"❌ Error crítico K-Means (descarga/carga): {e}")
        traceback.print_exc()
        return https_fn.Response(json.dumps({'error': f"Error interno K-Means (carga): {str(e)}"}), status=500, headers=headers)

    # --- Procesamiento de la solicitud ---
    try:
        if not req.is_json: 
            raise ValueError("La solicitud debe ser JSON.")
        
        req_json = req.get_json()
        data_es = req_json.get('data')
        
        if not isinstance(data_es, dict): 
            raise ValueError("Falta el campo 'data' o no es un objeto JSON.")

        data_en = translate_keys(data_es)
        if not data_en: 
            raise ValueError("Error traduciendo datos o datos vacíos.")
        
        df = pd.DataFrame([data_en])

        try: 
            kmeans_cols = preprocessor_kmeans.feature_names_in_
        except AttributeError: 
            raise RuntimeError("El preprocesador K-Means no tiene 'feature_names_in_'. Revisa el archivo .pkl.")

        df = df.reindex(columns=kmeans_cols, fill_value=None)

        # --- CORRECCIÓN 2.1: Validación de Nulos en el Backend ---
        # El frontend debe validar con 'required', pero esta es la
        # validación de seguridad del servidor.
        if df.isnull().values.any():
            missing_cols = df.columns[df.isnull().any()].tolist()
            print(f"ERROR K-Means: Nulos encontrados en columnas: {missing_cols}.")
            # Lanzamos un error que será enviado al usuario como 400 Bad Request
            raise ValueError(f"Faltan datos del formulario: {', '.join(missing_cols)}")
        # --- Fin CORRECCIÓN 2.1 ---

        data_processed = preprocessor_kmeans.transform(df)
        cluster = kmeans_model.predict(data_processed)
        predicted_cluster = int(cluster[0])

        print(f"Cluster predicho: {predicted_cluster}")

        return https_fn.Response(json.dumps({'cluster': predicted_cluster}), headers=headers, status=200)

    except Exception as e:
        print(f"❌ Error en predicción K-Means: {e}")
        traceback.print_exc()
        status = 400 if isinstance(e, (ValueError, KeyError, RuntimeError, AttributeError)) else 500
        return https_fn.Response(json.dumps({'error': f"Error K-Means (predicción): {str(e)}"}), status=status, headers=headers)

# ===============================================================
#  FUNCIÓN 2: ANALIZAR RIESGO (REGRESIÓN) PROGRAMADA
# ===============================================================
@scheduler_fn.on_schedule(schedule="0 3 * * *", timezone="America/Mexico_City", memory=512)
def analyze_risk_on_schedule(event) -> None:
    """Analiza riesgo académico nocturno para todos los usuarios."""
    import joblib
    import pandas as pd
    global preprocessor_regression, regression_model, db_client

    if db_client is None:
        try:
            print("🔄 Inicializando cliente Firestore (analyze_risk)...")
            db_client = firestore.client()
            print("✅ Cliente Firestore inicializado (analyze_risk).")
        except Exception as db_init_e:
            print(f"❌ Error FATAL inicializando Firestore: {db_init_e}")
            return
    
    db = db_client

    try:
        if preprocessor_regression is None:
            if not os.path.exists(REGRESSION_PREPROCESSOR_LOCAL):
                download_blob(GCS_BUCKET_NAME, REGRESSION_PREPROCESSOR_GCS, REGRESSION_PREPROCESSOR_LOCAL)
            print(f"🔄 Cargando preprocesador Regresión desde {REGRESSION_PREPROCESSOR_LOCAL}...")
            preprocessor_regression = joblib.load(REGRESSION_PREPROCESSOR_LOCAL)
            print("✅ Preprocesador Regresión cargado.")
        
        if regression_model is None:
            if not os.path.exists(REGRESSION_MODEL_LOCAL):
                download_blob(GCS_BUCKET_NAME, REGRESSION_MODEL_GCS, REGRESSION_MODEL_LOCAL)
            print(f"🔄 Cargando modelo Regresión desde {REGRESSION_MODEL_LOCAL}...")
            regression_model = joblib.load(REGRESSION_MODEL_LOCAL)
            print("✅ Modelo Regresión cargado.")
    except Exception as e:
        print(f"❌ Error crítico Regresión (descarga/carga): {e}")
        return

    processed_users = 0
    alerts_generated = 0
    
    try:
        print("Iniciando análisis de riesgo nocturno...")
        
        # --- NOTA 3.1: Como acordamos, dejamos la consulta sin optimizar
        # (para producción, añadir .where('onboardingComplete', '==', True))
        users_ref = db.collection('users').stream()

        for user_doc in users_ref:
            user_id = user_doc.id
            user_data = user_doc.to_dict()

            if not isinstance(user_data, dict) or not user_data.get('onboardingComplete'):
                continue
            
            profile_es = user_data.get('onboardingData')
            if not isinstance(profile_es, dict):
                continue

            try:
                profile_en = translate_keys(profile_es)
                if not profile_en: 
                    raise ValueError("Error traduciendo datos del perfil.")
                
                df = pd.DataFrame([profile_en])

                try: 
                    cols = preprocessor_regression.feature_names_in_
                except AttributeError: 
                    raise RuntimeError("El preprocesador de Regresión no tiene 'feature_names_in_'.")

                df = df.reindex(columns=cols, fill_value=None)
                
                if df.isnull().values.any():
                    missing_cols = df.columns[df.isnull().any()].tolist()
                    print(f"ADVERTENCIA Regresión: Usuario {user_id} omitido por datos faltantes: {missing_cols}.")
                    continue

                processed_data = preprocessor_regression.transform(df)
                probs = regression_model.predict_proba(processed_data)
                
                # --- NOTA 1.2: Como acordamos, NO se modifica esta lógica de predicción ---
                risk_prob = float(probs[0][0]) # Se mantiene en índice [0]

                print(f"Usuario {user_id} - Probabilidad de riesgo: {risk_prob:.2f}")
                processed_users += 1

                if risk_prob > 0.6: # Se mantiene la lógica original
                    recommendations_ref = db.collection(f'users/{user_id}/recommendations')
                    existing_alert_query = recommendations_ref.where('type', '==', 'risk_alert').where('viewed', '==', False).limit(1)
                    existing_alerts = list(existing_alert_query.stream())

                    if not existing_alerts:
                        text = "He notado que podrías estar en riesgo de no cumplir con tus próximos objetivos. ¿Revisamos tu plan de estudio?"
                        recommendations_ref.add({
                            'text': text,
                            'type': 'risk_alert',
                            'createdAt': firestore.SERVER_TIMESTAMP,
                            'viewed': False
                        })
                        alerts_generated += 1
                        print(f"⚠️ Alerta de riesgo generada para {user_id}.")

            except Exception as inner_e:
                print(f"❌ Error procesando usuario {user_id} (Regresión): {inner_e}")
                traceback.print_exc(limit=1)
                continue

    except Exception as e:
        print(f"❌ Error FATAL durante el análisis nocturno: {e}")
        traceback.print_exc()
        return

    print(f"✅ Análisis nocturno completado. Usuarios procesados: {processed_users}. Alertas generadas: {alerts_generated}.")

# ===============================================================
#  FUNCIÓN 3: IMPORTAR HORARIO (GEMINI) - CORREGIDA
# ===============================================================
import base64
# (datetime, dateutil y rrule ya se importaron globalmente)
import google.auth

# Mapeo de días
DAY_MAP = {
    'lunes': rrule.MO, 
    'martes': rrule.TU, 
    'miercoles': rrule.WE, 
    'jueves': rrule.TH, 
    'viernes': rrule.FR, 
    'sabado': rrule.SA, 
    'domingo': rrule.SU
}

@https_fn.on_request(memory=512)
def importSchedule(req: https_fn.Request) -> https_fn.Response:
    """Importa horario desde archivo (imagen/PDF base64) usando Gemini Vision."""
    global db_client, vision_model, vertexai_initialized

    # --- Manejo CORS ACTUALIZADO para Cloud Run ---
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '3600'
    }
    
    if req.method == 'OPTIONS':
        return https_fn.Response("", headers=headers, status=204)
    
    headers['Content-Type'] = 'application/json'
    # --- Fin CORS ---

    # --- Logging Detallado ---
    print("--- importSchedule Request Received ---")
    print(f"Method: {req.method}")
    headers_dict = {k.lower(): v for k, v in req.headers.items()}
    print("Headers (lowercase):", headers_dict)
    
    try:
        if req.is_json: 
            body = req.get_json()
            print("JSON Body (keys):", list(body.keys()) if isinstance(body, dict) else "Not a dict")
        else: 
            print("Body: Not JSON or empty")
    except Exception as e: 
        print(f"Error reading body: {e}")
    print("--- End Request Details ---")

    # --- Inicialización Perezosa Firestore ---
    if db_client is None:
        try: 
            print("🔄 Init Firestore (import)...")
            db_client = firestore.client()
            print("✅ Firestore OK.")
        except Exception as db_init_e: 
            return https_fn.Response(json.dumps({'error': f'DB init: {str(db_init_e)}'}), status=500, headers=headers)
    
    db = db_client

    # --- Inicialización Perezosa Gemini/Vertex AI ---
    if not vertexai_initialized:
        try:
            import vertexai
            from vertexai.generative_models import GenerativeModel, Part, FinishReason
            import vertexai.preview.generative_models as generative_models
            
            print("🔄 Init Vertex AI SDK...")
            credentials, PROJECT_ID = google.auth.default()
            LOCATION = 'us-central1'
            vertexai.init(project=PROJECT_ID, location=LOCATION, credentials=credentials)
            
            MODEL_NAME = "gemini-2.5-pro"
            vision_model = GenerativeModel(MODEL_NAME)
            vertexai_initialized = True
            print(f"✅ Vertex AI SDK OK ({MODEL_NAME}).")
            
        except ImportError: 
            print("❌ vertexai not installed.")
            return https_fn.Response(json.dumps({'error': 'IA dependency missing.'}), status=500, headers=headers)
        except Exception as e: 
            traceback.print_exc()
            print(f"❌ Vertex AI init error: {e}.")
            return https_fn.Response(json.dumps({'error': f'IA init error: {str(e)}'}), status=503, headers=headers)

    user_id = None
    
    try:
        # --- Autenticación MEJORADA ---
        auth_header = req.headers.get('authorization', '')
        print(f"Raw Authorization Header: '{auth_header}'")
        
        id_token = None
        parts = auth_header.split(None, 1)
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            id_token = parts[1].strip()
            print(f"Extracted Token (first 10 chars): '{id_token[:10]}...'")
        else:
            print("WARN: 'Bearer ' not found or incorrect format in Authorization header.")

        if not id_token:
            return https_fn.Response(
                json.dumps({'error': 'Auth token missing or invalid format (Bearer).'}), 
                status=401, 
                headers=headers
            )

        # Verificar el token
        try:
            decoded_token = auth.verify_id_token(id_token)
            user_id = decoded_token['uid']
            print(f"Auth OK: {user_id}")
        except Exception as auth_error:
            print(f"Auth verification error: {auth_error}")
            return https_fn.Response(
                json.dumps({'error': 'Invalid or expired token.'}), 
                status=401, 
                headers=headers
            )

        # --- Validación de entrada ---
        if not req.is_json: 
            raise ValueError("Request must be JSON.")
        
        req_data = req.get_json()
        file_b64 = req_data.get('fileData')
        end_date_str = req_data.get('endDate')
        mime_type = req_data.get('fileType', 'application/octet-stream')
        
        if not file_b64 or not end_date_str: 
            raise ValueError("Missing fileData or endDate.")
        
        try: 
            end_date = date_parser.isoparse(end_date_str).replace(tzinfo=None)
        except ValueError: 
            raise ValueError("Invalid endDate format (use ISO 8601).")
        
        try: 
            file_bytes = base64.b64decode(file_b64)
        except (TypeError, base64.binascii.Error): 
            raise ValueError("Invalid fileData format (base64).")
        
        print(f"Import req validated for {user_id} until {end_date.strftime('%Y-%m-%d')}, type: {mime_type}")

    except Exception as e:
        err_msg = f'Input/Auth format error: {str(e)}'
        print(f"❌ {err_msg}")
        return https_fn.Response(
            json.dumps({'error': err_msg}), 
            status=400, 
            headers=headers
        )

    # --- Llamada a Gemini ---
    schedule_data = []
    try:
        print("🤖 Calling Gemini...")
        from vertexai.generative_models import Part, FinishReason
        import vertexai.preview.generative_models as generative_models
        
        image_part = Part.from_data(data=file_bytes, mime_type=mime_type)
        text_part = Part.from_text("""Analiza imagen/PDF de horario. Extrae clases semanales. Devuelve SOLAMENTE lista JSON: [{'materia': string, 'diaSemana': string(Español minúsculas sin acentos, ej: lunes, miercoles), 'horaInicio': string(HH:MM 24h), 'horaFin': string(HH:MM 24h)}]. Ignora otros textos. No uses null. No inventes. Ej: [{'materia': 'Calculo I', 'diaSemana': 'lunes', 'horaInicio': '09:00', 'horaFin': '10:30'}, ...]""")
        
        gen_config = generative_models.GenerationConfig(
            temperature=0.1, 
            max_output_tokens=8192
        )
        
        safety_settings = {
            generative_models.HarmCategory.HARM_CATEGORY_HATE_SPEECH: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            generative_models.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            generative_models.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            generative_models.HarmCategory.HARM_CATEGORY_HARASSMENT: generative_models.HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
        }
        
        response = vision_model.generate_content(
            [image_part, text_part], 
            generation_config=gen_config, 
            safety_settings=safety_settings, 
            stream=False
        )

        # Validar respuesta de Gemini
        if not response.candidates or response.candidates[0].finish_reason != FinishReason.STOP:
            finish_reason = response.candidates[0].finish_reason if response.candidates else "No candidates"
            safety_ratings = response.candidates[0].safety_ratings if response.candidates and response.candidates[0].safety_ratings else "N/A"
            
            if finish_reason == FinishReason.SAFETY:
                raise ValueError(f"La IA bloqueó la respuesta por seguridad. Razón: {safety_ratings}")
            else:
                raise ValueError(f"Respuesta inválida de la IA. Razón: {finish_reason}.")

        if not response.candidates[0].content.parts: 
            raise ValueError("Respuesta válida de IA pero sin contenido.")

        raw_json = response.candidates[0].content.parts[0].text
        clean_json = raw_json.strip().lstrip('```json').rstrip('```').strip()
        print(f"Gemini JSON (clean):\n{clean_json}")

        # Parsear JSON
        try: 
            schedule_data = json.loads(clean_json)
        except json.JSONDecodeError as json_err:
            try:
                json_start = clean_json.find('[')
                json_end = clean_json.rfind(']') + 1
                if json_start != -1 and json_end != -1:
                    clean_json = clean_json[json_start:json_end]
                    schedule_data = json.loads(clean_json)
                    print("ADVERTENCIA: JSON extraído de una respuesta con texto adicional.")
                else: 
                    raise ValueError("No se encontró una lista JSON válida.")
            except (json.JSONDecodeError, ValueError):
                print(f"❌ Error parseando JSON de Gemini: {json_err}. Raw: {raw_json[:500]}...")
                raise ValueError("La respuesta de la IA no es un JSON válido o está mal formateada.")

        if not isinstance(schedule_data, list): 
            raise ValueError("La respuesta de la IA no es una lista JSON como se esperaba.")

        print(f"✅ Gemini extrajo {len(schedule_data)} items del horario.")

    except Exception as e:
        traceback.print_exc()
        print(f"❌ Error en llamada/procesamiento de Gemini: {e}")
        return https_fn.Response(
            json.dumps({'error': f'Error al analizar el archivo con IA: {str(e)}'}), 
            status=500, 
            headers=headers
        )

    # --- Generar Eventos y Guardar en Firestore ---
    created_ev_count = 0
    created_subj_count = 0
    skipped_count = 0
    processed_count = 0
    created_subj_cache = {}
    
    try:
        print("🗓️ Generando instancias de eventos y preparando lote...")
        batch = db.batch()
        subjects_ref = db.collection(f'users/{user_id}/subjects')

        # Cargar materias existentes
        existing_subjs = {doc.to_dict().get('name','').strip().lower(): doc.id for doc in subjects_ref.stream()}
        print(f"Materias existentes encontradas para {user_id}: {len(existing_subjs)}")

        # --- CORRECCIÓN 1.3: Definir la zona horaria local ---
        local_tz = pytz.timezone("America/Mexico_City")
        # --- Fin CORRECCIÓN 1.3 ---

        # --- CORRECCIÓN 3.2: Calcular inicio de la semana para dtstart ---
        # Usamos .now() con la zona horaria para ser consistentes
        today = datetime.datetime.now(local_tz).date()
        start_of_week = today - datetime.timedelta(days=today.weekday())
        # --- Fin CORRECCIÓN 3.2 ---


        for item in schedule_data:
            processed_count += 1
            
            # Extraer y validar datos
            mat_raw = item.get('materia')
            dia_raw = item.get('diaSemana', '')
            h_ini = item.get('horaInicio')
            h_fin = item.get('horaFin')

            # Validación estricta
            if not all([mat_raw, dia_raw, h_ini, h_fin,
                        isinstance(mat_raw, str), isinstance(dia_raw, str),
                        isinstance(h_ini, str), isinstance(h_fin, str)]):
                print(f"⚠️ Omitiendo item #{processed_count}: Datos inválidos. Recibido: {item}")
                skipped_count += 1
                continue

            mat_name = mat_raw.strip()
            dia_norm = dia_raw.strip().lower().replace('á','a').replace('é','e').replace('í','i').replace('ó','o').replace('ú','u')
            
            if not mat_name: 
                print(f"⚠️ Omitiendo item #{processed_count}: 'materia' vacía. Recibido: {item}")
                skipped_count += 1
                continue
                
            if dia_norm not in DAY_MAP: 
                print(f"⚠️ Omitiendo item #{processed_count}: Día inválido '{dia_raw}'. Recibido: {item}")
                skipped_count += 1
                continue

            # Validar y convertir horas
            try:
                start_t = datetime.datetime.strptime(h_ini.strip(), '%H:%M').time()
                end_t = datetime.datetime.strptime(h_fin.strip(), '%H:%M').time()
                rrule_d = DAY_MAP[dia_norm]
                
                if end_t <= start_t: 
                    raise ValueError("La hora de fin debe ser posterior a la de inicio.")
                    
            except (ValueError, AssertionError) as time_err: 
                print(f"⚠️ Omitiendo item #{processed_count} ('{mat_name}'): Hora inválida. Error: {time_err}")
                skipped_count += 1
                continue

            # --- Buscar o Crear Materia ---
            subj_id = None
            mat_norm = mat_name.lower()
            
            if mat_norm in created_subj_cache:
                subj_id = created_subj_cache[mat_norm]
            elif mat_norm in existing_subjs:
                subj_id = existing_subjs[mat_norm]
                created_subj_cache[mat_norm] = subj_id
            else:
                print(f"📚 Creando nueva materia: '{mat_name}'")
                new_subj_ref = subjects_ref.document()
                color_idx = (len(existing_subjs) + created_subj_count) % len(presetColors)
                new_color = presetColors[color_idx]
                
                batch.set(new_subj_ref, {
                    'name': mat_name, 
                    'color': new_color
                })
                
                subj_id = new_subj_ref.id
                created_subj_cache[mat_norm] = subj_id
                existing_subjs[mat_norm] = subj_id
                created_subj_count += 1

            # --- Generar Fechas y Eventos ---
            try:
                rule = rrule.rrule(
                    rrule.WEEKLY, 
                    byweekday=[rrule_d], 
                    dtstart=start_of_week, # --- CORRECCIÓN 3.2: Usar inicio de semana ---
                    until=end_date
                )
                
                ev_item_count = 0
                for ev_date in rule:
                    # --- CORRECCIÓN 1.3: Crear datetimes "aware" ---
                    ev_start_naive = datetime.datetime.combine(ev_date.date(), start_t)
                    ev_end_naive = datetime.datetime.combine(ev_date.date(), end_t)
                    
                    ev_start_aware = local_tz.localize(ev_start_naive)
                    ev_end_aware = local_tz.localize(ev_end_naive)
                    # --- Fin CORRECCIÓN 1.3 ---

                    ev_ref = db.collection(f'users/{user_id}/events').document()
                    
                    batch.set(ev_ref, {
                        'title': mat_name,
                        'start': ev_start_aware, # --- CORRECCIÓN 1.3: Guardar fecha "aware"
                        'end': ev_end_aware,   # --- CORRECCIÓN 1.3: Guardar fecha "aware"
                        'subject': subj_id,
                        'notes': 'Importado automáticamente.',
                        # --- CORRECCIÓN 1.1: Guardar 'uid' en lugar de '_id' ---
                        'user': {'uid': user_id} 
                        # --- Fin CORRECCIÓN 1.1 ---
                    })
                    
                    created_ev_count += 1
                    ev_item_count += 1
                    
                if ev_item_count > 0:
                    print(f"   -> Generadas {ev_item_count} instancias para '{mat_name}' los {dia_norm.capitalize()}")
                    
            except Exception as rrule_err:
                print(f"⚠️ Error generando fechas para '{mat_name}': {rrule_err}. Omitiendo.")
                skipped_count += 1
                continue

        # Ejecutar batch commit
        if created_subj_count > 0 or created_ev_count > 0:
            print(f"💾 Guardando {created_subj_count} materias nuevas y {created_ev_count} eventos nuevos...")
            batch.commit()
            print("✅ Batch commit exitoso!")
        else:
            print("ℹ️ No se generaron materias o eventos nuevos para guardar.")

        print(f"Resumen importación: Items procesados={processed_count}, Omitidos={skipped_count}, Materias nuevas={created_subj_count}, Eventos nuevos={created_ev_count}")

    except Exception as e:
        print(f"❌ Error FATAL durante generación/guardado de eventos: {e}")
        traceback.print_exc()
        return https_fn.Response(
            json.dumps({'error': f'Error procesando horario o guardando eventos: {str(e)}'}), 
            status=500, 
            headers=headers
        )

    # --- Respuesta Exitosa ---
    success_msg = f'Importación completada. {created_ev_count} eventos creados.'
    if created_subj_count > 0: 
        success_msg += f' {created_subj_count} materias nuevas añadidas.'
    if skipped_count > 0: 
        success_msg += f' {skipped_count} entradas inválidas del horario fueron omitidas.'
    
    succ_body = json.dumps({
        'message': success_msg, 
        'eventsCreated': created_ev_count, 
        'subjectsCreated': created_subj_count, 
        'skippedEntries': skipped_count
    })
    
    return https_fn.Response(succ_body, status=200, headers=headers)
