// src/hooks/useForm.js

import { useEffect, useMemo, useState } from "react";

export const useForm = (initialForm = {}, formValidations = {}) => {
  const [formState, setFormState] = useState(initialForm);

  // ✅ Cálculo de validaciones, solo se recalcula si formState cambia
  const formValidation = useMemo(() => {
    const formCheckedValues = {};
    for (const formField of Object.keys(formValidations)) {
      const [fn, errorMessage] = formValidations[formField];
      formCheckedValues[`${formField}Valid`] = fn(formState[formField])
        ? null
        : errorMessage;
    }
    return formCheckedValues;
  }, [formState, formValidations]);

  // ✅ Evita el bucle infinito: solo actualiza si realmente cambia el contenido
  useEffect(() => {
    if (JSON.stringify(formState) !== JSON.stringify(initialForm)) {
      setFormState(initialForm);
    }
  }, [initialForm]); // Se ejecuta solo cuando initialForm cambia realmente

  // ✅ Determina si el formulario es válido
  const isFormValid = useMemo(() => {
    for (const formValue of Object.keys(formValidation)) {
      if (formValidation[formValue] !== null) return false;
    }
    return true;
  }, [formValidation]);

  // ✅ Manejo de cambios en los inputs
  const onInputChange = ({ target }) => {
    const { name, value } = target;
    setFormState({
      ...formState,
      [name]: value,
    });
  };

  // ✅ Reinicia el formulario
  const onResetForm = () => {
    setFormState(initialForm);
  };

  return {
    ...formState,
    formState,
    onInputChange,
    onResetForm,
    ...formValidation,
    isFormValid,
  };
};
