import Link from "next/link";

export const metadata = {
  title: "404 Not Found｜courseX - 课程信息共享计划｜星期四 Thursday",
  robots: {
    index: false,
  },
};

const NotFound: React.FC = () => {
  return (
    <div className="h-screen flex justify-center items-center py-16 px-5">
      <div className="card p-12 bg-base-100 shadow-xl">
        <h1>404 Not Found</h1>
        <p>
          所访问的页面不存在，抑或是此课程还未被 courseX
          课程信息共享计划收录。你可以通过{" "}
          <Link href="/learnX">learnX App</Link>{" "}
          加入共享计划以帮助添加此课程的详细信息。
        </p>
        <Link className="btn btn-primary" href="/">
          返回主页
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
