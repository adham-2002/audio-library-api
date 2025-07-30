function passwordValidator(password) {
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

module.exports = passwordValidator;
