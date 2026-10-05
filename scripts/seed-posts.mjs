import mongoose from "mongoose";
import Category from "../models/category.ts";
import Post from "../models/post.ts";
import { connectToDatabase } from "../lib/mongodb.ts";

const posts = [
  {
    title: "How Artificial Intelligence Is Changing Everyday Technology",
    slug: "artificial-intelligence-changing-everyday-technology",
    excerpt:
      "From smarter search to practical assistants, AI is becoming a useful layer in the technology people already use every day.",
    categorySlug: "technology",
    tags: ["Artificial Intelligence", "Technology", "Digital Life"],
    status: "published",
    seo: {
      metaTitle: "How AI Is Changing Everyday Technology",
      metaDescription:
        "Explore how artificial intelligence is improving everyday tools, where it helps most, and why human judgment still matters.",
    },
    publishedAt: new Date("2026-09-18T09:00:00.000Z"),
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Artificial intelligence is moving beyond research labs and into familiar products. It can help people find information, organize work, and complete routine tasks with less friction.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "From novelty to useful tool" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "The most useful applications often feel ordinary. Search tools can interpret a question in context, while accessibility features can turn speech into text or describe information in new ways.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "These systems work best when they support a clear task rather than trying to replace every step of a person's workflow. A helpful suggestion can save time while leaving the final decision with the user.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Keeping people in control" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "AI output can be incomplete or mistaken, so important information still needs to be checked. Clear controls, privacy choices, and explanations help people understand when an automated feature is involved.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "As these tools become more common, thoughtful design will matter as much as technical capability. The strongest products make technology easier to use without hiding its limits.",
            },
          ],
        },
      ],
    },
  },
  {
    title: "Building Better Learning Habits in a Digital Classroom",
    slug: "building-better-learning-habits-digital-classroom",
    excerpt:
      "Modern education combines digital resources with focused practice, feedback, and the routines that help students retain what they learn.",
    categorySlug: "education",
    tags: ["Education", "Learning", "Digital Classrooms"],
    status: "published",
    seo: {
      metaTitle: "Better Learning Habits for the Digital Classroom",
      metaDescription:
        "Learn how structure, active practice, and useful feedback can make digital learning more effective for students.",
    },
    publishedAt: new Date("2026-09-20T09:00:00.000Z"),
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Digital classrooms give learners access to lessons, references, and collaboration tools from many places. Access alone, however, does not guarantee understanding; progress still depends on how learners engage with the material.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Make learning active" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Short practice sessions encourage students to retrieve ideas instead of only rereading them. Explaining a concept in their own words or solving a new example can reveal what they understand and what needs another look.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "A simple routine helps: choose one goal, work without switching tasks, and finish by noting the main idea. Regular breaks can make longer study periods easier to sustain.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Use feedback to guide the next step" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Feedback is most useful when it arrives in time to shape the next attempt. Digital tools can make comments and practice results easier to review, while teachers add context and encouragement that automated scores cannot provide.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "When technology supports clear goals, active practice, and human guidance, it can make learning more flexible without losing the structure students need.",
            },
          ],
        },
      ],
    },
  },
  {
    title: "Finding Balance in the World of Digital Entertainment",
    slug: "finding-balance-digital-entertainment",
    excerpt:
      "Streaming, games, and online communities offer new ways to relax and connect, but a little intention can make screen time more rewarding.",
    categorySlug: "entertainment",
    tags: ["Entertainment", "Streaming", "Gaming"],
    status: "published",
    seo: {
      metaTitle: "A More Balanced Approach to Digital Entertainment",
      metaDescription:
        "Discover practical ways to enjoy streaming, games, and online entertainment while making room for rest and connection.",
    },
    publishedAt: new Date("2026-09-22T09:00:00.000Z"),
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Digital entertainment makes it easy to discover a new series, play with friends, or follow a live event. With so many choices close at hand, deciding what to enjoy can become part of the experience.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Choose what you want from the moment" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "A quick check-in can help: are you looking to unwind, learn something, or spend time with other people? Choosing an activity with that intention makes it easier to avoid endless browsing.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Shared viewing and multiplayer games can create genuine social moments. The value often comes not only from the screen, but also from the conversation and memories people make together.",
            },
          ],
        },
        {
          type: "heading",
          attrs: { level: 2 },
          content: [{ type: "text", text: "Make room for a satisfying stopping point" }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "Small boundaries, such as choosing an episode in advance or setting a reminder before a game session, can help entertainment fit around sleep, work, and other plans.",
            },
          ],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "There is no single ideal amount of screen time for everyone. Paying attention to how an activity leaves you feeling is a practical way to keep digital entertainment enjoyable and balanced.",
            },
          ],
        },
      ],
    },
  },
];

async function seedPosts() {
  const database = await connectToDatabase();

  try {
    await Promise.all([Category.init(), Post.init()]);

    let createdCount = 0;
    let updatedCount = 0;

    for (const post of posts) {
      const category = await Category.findOne({
        slug: post.categorySlug,
      })
        .select("_id")
        .exec();

      if (!category) {
        throw new Error(
          `Required category "${post.categorySlug}" does not exist. Run npm run seed:categories first.`,
        );
      }

      const { categorySlug, ...postData } = post;
      const result = await Post.updateOne(
        { slug: post.slug },
        {
          $set: {
            ...postData,
            category: category._id,
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        {
          upsert: true,
          runValidators: true,
        },
      ).exec();

      if (result.upsertedCount > 0) {
        createdCount += 1;
      } else if (result.modifiedCount > 0) {
        updatedCount += 1;
      }
    }

    console.log(
      `Post seed complete: ${createdCount} created, ${updatedCount} updated, ${posts.length - createdCount - updatedCount} unchanged.`,
    );
  } finally {
    await database.disconnect();
  }
}

seedPosts().catch((error) => {
  const errorName = error instanceof Error ? error.name : "UnknownError";
  console.error(`Post seed failed (${errorName}).`);
  if (mongoose.connection.readyState !== 0) {
    void mongoose.disconnect();
  }
  process.exitCode = 1;
});
