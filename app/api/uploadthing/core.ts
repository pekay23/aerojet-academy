import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const f = createUploadthing();

export const ourFileRouter = {
  // Existing payment proof route
  paymentProof: f({ image: { maxFileSize: "4MB", maxFileCount: 1 }, pdf: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Proof uploaded:", file.url);
    }),

  // --- NEW: Admin Only Photo Upload ---
  adminStudentPhoto: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      // STRICT CHECK: Only Admin/Staff can upload to this endpoint
      if (!session || (session.user as any).role === 'STUDENT') throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      console.log("ID Photo uploaded:", file.url);
    }),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
