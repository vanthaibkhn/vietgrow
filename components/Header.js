import AuthButton from "@/components/AuthButton";

export default function Header() {
  return (
    <header className="flex justify-between items-center p-4 border-b bg-white">
      <h1 className="font-bold text-lg text-gray-800">🌱 VietGrow AI</h1>
      <AuthButton />
    </header>
  );
}

