import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const f = createUploadthing();

export const ourFileRouter = {
  // 1. Payment Proof (Students/Public)
  paymentProof: f({ image: { maxFileSize: "4MB", maxFileCount: 1 }, pdf: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      // Allow if logged in OR if handling public submission (handled by client logic usually, but here we enforce session for safety if desired, or you can remove auth check for truly public)
      // For now, keeping your existing auth check:
      if (!session || !session.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      console.log("Proof uploaded:", file.url);
    }),

  // 2. Admin Only Photo Upload (For uploading OTHER people's photos)
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

  // 3. User Profile Image (Self-Update for Admin/Staff/Student)
  userProfileImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session || !session.user) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      console.log("Profile Pic Updated:", file.url);
    }),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
