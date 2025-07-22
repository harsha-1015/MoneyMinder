import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function BasicInformation() {
  const [email, setEmail] = useState("");
  const [fullname, setFullname] = useState("");
  const [formData, setFormData] = useState({
    occupation: "",
    salary: 0,
    maritalStatus: "",
    gender: "",
  });

  const [password, setPassword] = useState("");
  const [reenterPassword, setReenterPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [ActeptedPassword, setActeptedPassword] = useState("");
  const navigate = useNavigate();

  const occupations = [
    "Student",
    "Working Professional",
    "Freelancer",
    "Business",
    "Non-professional",
  ];
  const maritalStatuses = ["Single", "Married", "Divorced", "Widowed"];
  const genders = ["Male", "Female", "Other"];

  useEffect(() => {
    setEmail(localStorage.getItem("email") || "");
    setFullname(localStorage.getItem("fullname") || "");
    localStorage.removeItem('email')
    localStorage.removeItem('fullname')
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "salary" ? parseInt(value) : value,
    }));
  };

  const validatePassword = (pwd) => {
    const errors = [];

    if (!/[A-Z]/.test(pwd)) errors.push("At least one uppercase letter");
    if (!/[a-z]/.test(pwd)) errors.push("At least one lowercase letter");
    if (!/[0-9]/.test(pwd)) errors.push("At least one number");
    if (!/[!@#$%^&*]/.test(pwd))
      errors.push("At least one special character (!@#$%^&*)");
    if (pwd.length < 8) errors.push("Minimum 8 characters");

    return errors;
  };

  const checkIfEmailExists = async () => {
    const response = await fetch("http://127.0.0.1:8000/app/api/check-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    const data = await response.json();
    return data.exists;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Password validation
    const errors = validatePassword(password);
    setPasswordErrors(errors);

    if (errors.length > 0) {
      alert("Password does not meet the requirements");
      return;
    }

    if (password !== reenterPassword) {
      setPasswordMatch(false);
      alert("Passwords do not match");
      return;
    } else {
      setPasswordMatch(true);
      setActeptedPassword(password);
    }

    const emailExists = await checkIfEmailExists();
    if (emailExists) {
      alert("This email is already registered.");
      return;
    }

    const payload = {
      full_name: fullname,
      email: email,
      gender: formData.gender,
      occupation: formData.occupation,
      salary: formData.salary,
      marital_status: formData.maritalStatus,
      password: ActeptedPassword,
    };

    try {
      const request = await fetch("http://127.0.0.1:8000/app/api/basic-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = await request.json();
      console.log(result);
      if (result.status === "success") {
        alert("Data submitted successfully!");
        navigate("/login");
      } else {
        alert("Error: " + result.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-lg w-full max-w-lg space-y-6"
      >
        <h2 className="text-2xl font-bold text-center text-indigo-600">
          Basic Information
        </h2>

        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            type="text"
            name="fullname"
            value={fullname}
            readOnly
            className="w-full border px-4 py-2 rounded-lg bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="text"
            name="email"
            value={email}
            readOnly
            className="w-full border px-4 py-2 rounded-lg bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Gender</label>
          <div className="flex space-x-6">
            {genders.map((g, idx) => (
              <label key={idx} className="inline-flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={formData.gender === g}
                  onChange={handleChange}
                  className="mr-2"
                />
                {g}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Occupation</label>
          <select
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
            required
          >
            <option value="">-- Select Occupation --</option>
            {occupations.map((occ, idx) => (
              <option key={idx} value={occ}>
                {occ}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Salary (₹)</label>
          <input
            type="range"
            name="salary"
            min={0}
            max={10000000}
            step={1000}
            value={formData.salary}
            onChange={handleChange}
            className="w-full"
          />
          <p className="text-sm text-gray-600 mt-1">
            ₹{formData.salary.toLocaleString()}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Marital Status
          </label>
          <select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
            required
          >
            <option value="">-- Select Status --</option>
            {maritalStatuses.map((status, idx) => (
              <option key={idx} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordErrors(validatePassword(e.target.value));
            }}
            className="w-full border px-4 py-2 rounded-lg"
            required
          />
        </div>

        {/* Password Criteria */}
        {passwordErrors.length > 0 && (
          <ul className="text-red-500 text-sm list-disc pl-5 space-y-1">
            {passwordErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        )}

        {/* Re-enter password */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Re-enter Password
          </label>
          <input
            type="password"
            value={reenterPassword}
            onChange={(e) => setReenterPassword(e.target.value)}
            className="w-full border px-4 py-2 rounded-lg"
            required
          />
        </div>
        {!passwordMatch && (
          <p className="text-red-500 text-sm">Passwords do not match.</p>
        )}

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

export default BasicInformation;
