import Link from "next/link";
import { DashboardSection } from "@/components/admin-dashboard/dashboard-components";
import { StatusBadge } from "@/components/admin-dashboard/status-badge";
import type { PostStatus } from "@/models/post";

const recentPosts: {
  title: string;
  slug: string;
  category: string;
  status: PostStatus;
  dateTime: string;
  date: string;
}[] = [
  {
    title: "How Artificial Intelligence Is Changing Education",
    slug: "how-ai-is-changing-education",
    category: "Technology",
    status: "published",
    dateTime: "2026-10-04",
    date: "Oct 04, 2026",
  },
  {
    title: "Modern Learning Methods for Students",
    slug: "modern-learning-methods",
    category: "Education",
    status: "draft",
    dateTime: "2026-10-03",
    date: "Oct 03, 2026",
  },
  {
    title: "The Evolution of Digital Entertainment",
    slug: "evolution-of-digital-entertainment",
    category: "Entertainment",
    status: "published",
    dateTime: "2026-10-02",
    date: "Oct 02, 2026",
  },
];

export function RecentPosts() {
  return (
    <DashboardSection
      title="Recent Posts"
      description="Recently created or updated articles"
      action={
        <Link
          href="/admin-dashboard/posts"
          className="shrink-0 text-sm font-medium text-[#02a95c] hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#02a95c]"
        >
          View all
        </Link>
      }
      contentClassName="overflow-x-auto"
    >
      <table className="w-full min-w-[680px] text-left text-sm">
        <caption className="sr-only">Recently created or updated posts</caption>
        <thead className="bg-gray-50 text-gray-500">
          <tr>
            <th scope="col" className="px-6 py-4 font-medium">
              Post
            </th>
            <th scope="col" className="px-6 py-4 font-medium">
              Category
            </th>
            <th scope="col" className="px-6 py-4 font-medium">
              Status
            </th>
            <th scope="col" className="px-6 py-4 font-medium">
              Date
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {recentPosts.map((post) => (
            <tr key={post.slug} className="transition-colors hover:bg-gray-50">
              <th scope="row" className="px-6 py-4 text-left font-medium">
                <p className="max-w-[22rem] text-[#444444]">{post.title}</p>
                <p className="mt-1 text-xs font-normal text-gray-400">
                  /{post.slug}
                </p>
              </th>
              <td className="px-6 py-4 text-gray-600">{post.category}</td>
              <td className="px-6 py-4">
                <StatusBadge status={post.status} />
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                <time dateTime={post.dateTime}>{post.date}</time>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DashboardSection>
  );
}
