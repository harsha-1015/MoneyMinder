import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import BasicInformation from "./BasicInformation";

function Email() {
  const [firstname, setFirstName] = useState("");
  const [lastname, setLastName] = useState("");
  const [fullname, setFullName] = useState("");
  const [validemail, setvalidemail] = useState(false);
  const [email, setEmail] = useState("");
  const [systemotp, setsystemOtp] = useState("");
  const [enterOtp, setEnterOtp] = useState("");
  const navigate = useNavigate();
  const [verifyOTP, setVerifyOtp] = useState(false);

  const handleBackendInfo = async () => {
    const payload = { email };
    try {
      const request = await fetch("http://127.0.0.1:8000/app/api/email-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const res = await request.json();
      if (res.status == "sent") {
        setvalidemail(true);
        setsystemOtp(res.otp);
        console.log(res.otp);
      } else {
        alert("Something went wrong! Try again.");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (firstname.length < 1 || lastname.length < 1) {
      alert("Invalid name! Enter correct name");
      return;
    }
    setFullName(firstname +" "+ lastname);
    const url = `https://validect-email-verification-v1.p.rapidapi.com/v1/verify?email=${email}`;
    const options = {
      method: "GET",
      headers: {
        "x-rapidapi-key": "bb76e56f7amsheb096c88c1081d2p1a5178jsn01c85ac479bf",
        "x-rapidapi-host": "validect-email-verification-v1.p.rapidapi.com",
      },
    };

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      if (result.status == "valid") {
        handleBackendInfo();
      } else {
        alert("Enter a valid email");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleOTPsubmit = async(e) => {
    e.preventDefault();
    if (String(systemotp) === String(enterOtp)) {
      if(!email){
        alert("email is not defined")
        return
      }
      localStorage.setItem('email',email)
      localStorage.setItem('fullname',fullname)
      navigate('/basic-information')
      
    } else {
      alert("Invalid OTP!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tr from-indigo-100 to-blue-200 p-6">
      <div className="w-full max-w-md bg-white shadow-xl rounded-xl p-8">
        {!validemail ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-center text-indigo-600">
              Register
            </h2>

            <div>
              <label className="block text-sm font-medium">First Name</label>
              <input
                type="text"
                className="mt-1 w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Last Name</label>
              <input
                type="text"
                className="mt-1 w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                className="mt-1 w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={email} onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition"
            >
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleOTPsubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-indigo-600 text-center">
              Verify OTP
            </h2>
            <p className="text-sm text-center text-gray-500">
              OTP sent to <strong>{email}</strong>
            </p>

            <div>
              <label className="block text-sm font-medium">Enter OTP</label>
              <input
                type="numeric"
                className="mt-1 w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                onChange={(e) => setEnterOtp(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg transition"
            >
              Verify
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default Email;
