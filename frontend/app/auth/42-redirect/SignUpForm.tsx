"use client";
import { faPen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User } from "../../../types";

async function finishSignup(
  email: string,
  username: string,
  passwd: string,
  passwordConf: string,
  avatar: File,
  router: AppRouterInstance
) {
  if (avatar) {
    const formData = new FormData();
    formData.append("avatar", avatar);
    try {
      const response = await fetch("http://localhost:3000/auth/uploadAvatar", {
        credentials: "include",
        method: "POST",
        body: formData,
      });
      if (response.ok) {
        console.log("File uploaded successfully.");
      } else {
        alert("File upload failed.");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  }
  const response = await fetch("http://localhost:3000/auth/finish_signup", {
    credentials: "include",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email: email,
      username: username,
      password: passwd,
      passwordConf: passwordConf,
    }),
  });
  if (response.ok) {
    const res = await response.json();
    console.log("res:", res);
    router.push("/profile");
  } else alert("Failed to Finish Signup");
}

const SignUpForm: React.FC<User> = ({ email, username, avatarLink }) => {
  const router: AppRouterInstance = useRouter();
  const [avatar, setAvatar] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(avatarLink);
  const [newUsername, setUsername] = useState<string>(username);
  const [passwd, setPasswd] = useState<string>("");
  const [confPasswd, setConfPasswd] = useState<string>("");

  function handleSubmit(e: any) {
    e.preventDefault();
    console.log("data:", email, newUsername, passwd, confPasswd, avatar);
    finishSignup(email, newUsername, passwd, confPasswd, avatar, router);
  }

  return (
    <>
      <div className="flex flex-col	items-center justify-center	 my-10">
        <h1 className="text-5xl pb-10 "> Create a new account </h1>
        <div className="flex flex-col justify-start items-end mb-5">
          <div className="rounded-full w-40 h-40">
            <picture>
              <img
                className="rounded-full w-auto h-auto"
                src={previewUrl}
                alt="Profile Picture"
              />
            </picture>
          </div>
          <div>
            <label
              htmlFor="upload"
              className="w-12 h-12 bg-black p-3 rounded-full"
            >
              <FontAwesomeIcon icon={faPen} color="white" />
            </label>
          </div>
        </div>
        <div>
          <form onSubmit={handleSubmit}>
            <input
              name="avatar"
              type="file"
              id="upload"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                const maxFileSize = 1024 * 1024 * 5;
                if (file) {
                  console.log(file);
                  const maxFileSize = 1024 * 1024 * 5;
                  if (file.size > maxFileSize) {
                    alert(
                      "File is too large. Please upload a file smaller than 5 MB."
                    );
                    return;
                  }
                  setPreviewUrl(URL.createObjectURL(file));
                  setAvatar(file);
                }
              }}
            />
            <input
              required
              className="block border-2 border-gray-200 px-4 py-2 mb-2 rounded-lg"
              type="text"
              placeholder="Username"
              defaultValue={newUsername}
              onChange={(e) => {
                setUsername(e.target.value);
              }}
            ></input>
            <input
              required
              className="block border-2 border-gray-200 px-4 py-2 mb-2 rounded-lg"
              type="password"
              placeholder="Password"
              onChange={(e) => {
                setPasswd(e.target.value);
              }}
            ></input>
            <input
              required
              className="block border-2 border-gray-200 px-4 py-2 mb-2 rounded-lg"
              type="password"
              placeholder="Confirm password"
              onChange={(e) => {
                setConfPasswd(e.target.value);
              }}
            ></input>
            <button
              className="block bg-zinc-200 px-6 py-3 mb-4 rounded-lg w-full"
              type="submit"
            >
              Sign up
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default SignUpForm;
