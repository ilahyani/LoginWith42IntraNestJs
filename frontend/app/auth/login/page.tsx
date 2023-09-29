"use client";
import Link from "next/link";
import SigninForm from "./components/SigninForm";

export default function LoginPage() {
  return (
    <>
      <div className="flex flex-col	items-center justify-center	 my-10">
        <h1 className="text-5xl pb-10 ">WELCOME TO PONG CLUB</h1>
        <div>
          <SigninForm />
          <Link href="http://localhost:3000/auth/42">
            <button className="block bg-zinc-200 px-6 py-3 mb-4 rounded-lg w-full">
              Continue With Intra
            </button>
          </Link>
        </div>
      </div>
    </>
  );
}
