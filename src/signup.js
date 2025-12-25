const nameInput = document.getElementById("name");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirm-password");
const togglePassword = document.getElementById("togglePassword");
const createBtn = document.getElementById("createAccountBtn");
const alertBox = document.getElementById("alert");

// Toggle password visibility
togglePassword.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";

  togglePassword.classList.toggle("fa-eye");
  togglePassword.classList.toggle("fa-eye-slash");
});

function showError(message) {
  alertBox.classList.add("error");
  alertBox.style.display = "block";
  alertBox.textContent = message;
}

// Password validation
createBtn.addEventListener("click", () => {
  const name = nameInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  if (password === "" || confirmPassword === "") {
    showError("Please enter your password");
  } else if (password !== confirmPassword) {
    showError("Password mismatch. Please try again.");
  }
});
