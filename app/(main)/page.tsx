import Link from "next/link";

const FeatureCard: React.FC<{
  title: string;
  description: string;
  url: string;
}> = ({ title, description, url }) => (
  <Link
    className="btn btn-block prose-base h-auto flex flex-col items-center normal-case max-w-sm px-4 py-6 text-base sm:text-lg"
    href={url}
  >
    <h2>{title}</h2>
    <p className="font-normal">{description}</p>
  </Link>
);

const Home: React.FC = () => {
  return (
    <main className="prose-a:no-underline prose-a:hover:no-underline prose-h1:mb-4 prose-h2:mb-0 prose-h2:mt-0 prose-p:my-0 py-16 px-5 text-center min-h-dvh flex flex-col items-center justify-center">
      <div>
        <h1>
          星期四 <span className="text-primary">Thu</span>rsday
        </h1>
        <p>星期四大学信息化建设推进计划</p>
      </div>
      <div className="w-full py-10 space-y-4 flex flex-col items-center">
        <FeatureCard
          title="courseX"
          description="课程信息共享计划"
          url="/courses"
        />
        <FeatureCard
          title="learnX"
          description="网络学堂新选择"
          url="/learnX"
        />
      </div>
    </main>
  );
};

export default Home;
