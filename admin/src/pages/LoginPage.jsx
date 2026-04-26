import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/react";
import React from "react";

export default function LoginPage() {
  return (
    <div>
      LoginPage
      <header>
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
    </div>
  );
}
