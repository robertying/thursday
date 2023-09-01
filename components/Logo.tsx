import Image from "next/image";
import logo from "public/logo-512x512.png";

const Logo: React.FC = () => {
  return (
    <Image
      priority
      src={logo}
      alt="Logo"
      className="rounded-full w-24 h-24 animate-bounce"
    />
  );
};

export default Logo;
