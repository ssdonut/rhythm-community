export default function HomePage() {
  return (
      <main className="min-h-screen bg-white text-gray-900">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-4xl font-bold">音游论坛交流平台</h1>
          <p className="mt-4 text-lg text-gray-600">
            基于 Next.js 14 + TypeScript + PostgreSQL + Prisma 构建的音游社区系统
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border p-6 shadow-sm">
              <h2 className="text-xl font-semibold">社区讨论</h2>
              <p className="mt-2 text-gray-600">
                支持帖子发布、评论互动、点赞收藏与分类浏览
              </p>
            </div>

            <div className="rounded-2xl border p-6 shadow-sm">
              <h2 className="text-xl font-semibold">谱面分享</h2>
              <p className="mt-2 text-gray-600">
                提供谱面展示、资源说明与交流分享功能
              </p>
            </div>

            <div className="rounded-2xl border p-6 shadow-sm">
              <h2 className="text-xl font-semibold">战绩展示</h2>
              <p className="mt-2 text-gray-600">
                支持玩家成绩记录、个人展示与后续可视化分析
              </p>
            </div>

            <div className="rounded-2xl border p-6 shadow-sm">
              <h2 className="text-xl font-semibold">同人作品</h2>
              <p className="mt-2 text-gray-600">
                展示音游相关同人创作内容，支持社区交流
              </p>
            </div>

            <div className="rounded-2xl border p-6 shadow-sm">
              <h2 className="text-xl font-semibold">开团功能</h2>
              <p className="mt-2 text-gray-600">
                提供活动发起、报名参与和进度查看等功能
              </p>
            </div>

            <div className="rounded-2xl border p-6 shadow-sm">
              <h2 className="text-xl font-semibold">用户系统</h2>
              <p className="mt-2 text-gray-600">
                包含注册登录、个人信息管理与权限控制
              </p>
            </div>
          </div>
        </div>
      </main>
  );
}