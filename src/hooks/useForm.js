import { useEffect, useMemo, useState } from "react";

const areFormValuesEqual = (currentForm, nextForm) => {
  const currentKeys = Object.keys(currentForm);
  const nextKeys = Object.keys(nextForm);

  if (currentKeys.length !== nextKeys.length) {
    return false;
  }

  return nextKeys.every((key) => currentForm[key] === nextForm[key]);
};

export const useForm = (initialForm = {}, formValidations = {}) => {
  const [formState, setFormState] = useState(initialForm);

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

  useEffect(() => {
    setFormState((currentForm) =>
      areFormValuesEqual(currentForm, initialForm) ? currentForm : initialForm
    );
  }, [initialForm]);

  const isFormValid = useMemo(() => {
    for (const formValue of Object.keys(formValidation)) {
      if (formValidation[formValue] !== null) return false;
    }
    return true;
  }, [formValidation]);

  const onInputChange = ({ target }) => {
    const { name, value } = target;
    setFormState({
      ...formState,
      [name]: value,
    });
  };

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
