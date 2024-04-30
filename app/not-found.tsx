import Link from "next/link";

export const metadata = {
  title: "404 Not Found｜星期四 Thursday",
  robots: {
    index: false,
  },
};

const NotFound: React.FC = () => {
  return (
    <div className="h-dvh flex justify-center items-center py-16 px-5">
      <div className="card p-12 bg-base-100 shadow-xl">
        <h1>404 Not Found</h1>
        <p>所访问的页面不存在。</p>
        <Link className="btn btn-primary" href="/">
          返回主页
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
