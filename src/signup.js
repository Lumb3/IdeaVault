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
createBtn.addEventListener("click", async () => {
  const name = nameInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;
  
  // Clear any existing alerts
  alertBox.style.display = "none";
  alertBox.classList.remove("error", "success");
  
  if (!name) {
    showError("Please enter a username");
    return;
  }
  
  if (name.length < 3) {
    showError("Username must be at least 3 characters");
    return;
  }
  
  if (password === "" || confirmPassword === "") {
    showError("Please enter your password");
    return;
  }
  
  if (password.length < 6) {
    showError("Password must be at least 6 characters");
    return;
  }
  
  if (password !== confirmPassword) {
    showError("Password mismatch. Please try again.");
    return;
  }
  
  // Disable button during signup
  createBtn.disabled = true;
  createBtn.textContent = "Creating account...";
  
  try {
    const response = await window.authAPI.signup(name, password);
    
    if (response.success) {
      alertBox.classList.remove("error");
      alertBox.classList.add("success");
      alertBox.style.display = "block";
      alertBox.textContent = "Account created successfully!";
      
      // Redirect to login after 1.5 seconds
      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } else {
      showError(response.message);
      createBtn.disabled = false;
      createBtn.textContent = "Create Account";
    }
  } catch (error) {
    console.error("Signup error:", error);
    showError("An error occurred. Please try again.");
    createBtn.disabled = false;
    createBtn.textContent = "Create Account";
  }
});
