const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");
const toggle_Lock = document.getElementById("toggleLock");
const username = document.getElementById("username");

togglePassword.addEventListener("click", function () {
  // Toggle password visibility
  const type =
    password.getAttribute("type") === "password" ? "text" : "password";
  password.setAttribute("type", type);

  this.classList.toggle("fa-eye-slash");
  this.classList.toggle("fa-eye");
});

// Will be encrypted through hashing
function checkPasswordandUsername() {
  const pass = password.value;
  const user = username.value;
  if (pass === "HUU" && user === "Eric") {
    toggle_Lock.classList.add("fa-lock-open");
    console.log("true");
    window.location.href = "index.html";
  } else {
    console.log("false");
  }
}
