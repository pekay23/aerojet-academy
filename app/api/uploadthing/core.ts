import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

const f = createUploadthing();

export const ourFileRouter = {
  // Define a route for "paymentProof"
  paymentProof: f({ image: { maxFileSize: "4MB", maxFileCount: 1 }, pdf: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async () => {
      // This code runs on your server before upload
      const session = await getServerSession(authOptions);
      if (!session || !session.user) throw new Error("Unauthorized");
      
      // Whatever is returned here is accessible in onUploadComplete
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code runs on your server AFTER upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      // We don't save to DB here because we need the Fee ID. 
      // We'll handle the DB update on the frontend callback.
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
