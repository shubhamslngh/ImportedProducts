"use client";

import { FormEvent, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation, useQuery } from "@apollo/client";
import { GET_POST_BY_SLUG, ADD_COMMENT, GET_COMMENTS_BY_POST } from "@/lib/queries";
import { LiquidLoader } from "@/components/LiquidLoader";
import { PageWrapper } from "@/components/PageWrapper";
import { PageSection } from "@/components/PageSection";
import { useSession } from "@/lib/session-context";
import { useSnackbar } from "@/components/SnackbarProvider";

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;

  /* ------------------------- Main post query ------------------------- */
  const {
    data,
    loading: postLoading,
    error: postError,
    refetch: refetchPost,
  } = useQuery(GET_POST_BY_SLUG, {
    skip: !slug,
    variables: { slug },
    fetchPolicy: "no-cache",
  });

  const post = data?.post ?? null;

  /* ------------------------- Comments query (safe) ------------------------- */
  const {
    data: commentsData,
    loading: commentsLoading,
    error: commentsError
  } = useQuery(GET_COMMENTS_BY_POST, {
    variables: { postId: post?.databaseId ?? 0 },
    skip: !post?.databaseId, // ensures hook order stays stable
    fetchPolicy: "no-cache",
  });

  /* ------------------------- Add Comment Hook ------------------------- */
  const [commentContent, setCommentContent] = useState("");
  const [addComment, { loading: postingComment }] = useMutation(ADD_COMMENT);

  const { status: sessionStatus, user } = useSession();
  const { showSnackbar } = useSnackbar();

  /* ------------------------- Format date ------------------------- */
  const formattedDate = useMemo(() => {
    if (!post?.date) return "";
    try {
      return new Date(post.date).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return post.date;
    }
  }, [post?.date]);

  /* ------------------------- Loading State ------------------------- */
  if (postLoading) {
    return (
      <main className= "flex flex-col gap-8 py-6" >
      <PageWrapper>
      <PageSection>
      <LiquidLoader message="Loading story…" />
        </PageSection>
        </PageWrapper>
        </main>
    );
  }

  /* ------------------------- Error State ------------------------- */
  if (postError || !post) {
    return (
      <main className= "flex flex-col gap-8 py-6" >
      <PageWrapper>
      <PageSection>
      <div className="rounded-3xl border border-rose-200 bg-rose-50/80 p-6 text-rose-700" >
        <p className="font-semibold" > Unable to load this story.</p>
          < p className = "text-sm" > { postError?.message ?? "Please try another link."
  } </p>

    < button
  type = "button"
  onClick = {() => router.back()
}
className = "mt-4 inline-flex items-center rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white"
  >
  Go back
    </button>
    </div>
    </PageSection>
    </PageWrapper>
    </main>
    );
  }

/* ------------------------- Comments list ------------------------- */
const comments = commentsData?.post?.comments?.nodes ?? [];

return (
  <main className= "flex flex-col gap-8 py-6" >
  <PageWrapper>
  <PageSection>
  <article className="space-y-10 max-w-3xl mx-auto" >

    {/* ------------ HEADER ------------ */ }
    < header className = "space-y-3 text-center" >
      <p className="text-xs uppercase tracking-[0.35em] text-slate-400" >
        { formattedDate }
        </p>

        < h1
className = "text-4xl font-extrabold leading-tight text-slate-900"
dangerouslySetInnerHTML = {{ __html: post.title }}
              />

{
  post.author?.node?.name && (
    <p className="text-sm text-slate-500" >
      By { post.author.node.name }
  </p>
              )
}
</header>

{/* ------------ FEATURED IMAGE ------------ */ }
{
  post.featuredImage?.node?.sourceUrl && (
    <div className="overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow" >
      <Image
                  src={ post.featuredImage.node.sourceUrl }
  alt = { post.featuredImage.node.altText || post.title }
  width = { 960}
  height = { 540}
  className = "h-full w-full object-cover"
    />
    </div>
            )
}

{/* ------------ CONTENT ------------ */ }
<div
              className="article-content"
dangerouslySetInnerHTML = {{ __html: post.content ?? "" }}
            />

{/* ------------ COMMENTS SECTION ------------ */ }
<section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm" >
  <div className="space-y-1" >
    <p className="text-xs uppercase tracking-[0.35em] text-slate-400" >
      Comments
      </p>
      < h2 className = "text-xl font-semibold text-slate-900" >
        Join the conversation({ comments.length })
          </h2>
          </div>

{/* Comments */ }
{
  commentsLoading ? (
    <p className= "text-sm text-slate-500" > Loading comments…</p>
              ) : commentsError ? (
    <p className= "text-sm text-rose-600" > Failed to load comments.</p>
              ) : comments.length ? (
    <ul className= "space-y-4" >
    {
      comments.map((comment: any) => (
        <li
                      key= { comment.databaseId }
                      className = "rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
        >
        <p className="text-sm font-semibold text-slate-900" >
        { comment.author?.node?.name ?? "Anonymous" }
        </p>
      < p className = "text-xs text-slate-400" >
      { new Date(comment.date).toLocaleDateString() }
      </p>
      < div
                        className = "mt-2 text-sm text-slate-700"
                        dangerouslySetInnerHTML = {{ __html: comment.content }}
    />
    </li>
                  ))
}
</ul>
              ) : (
  <p className= "text-sm text-slate-500" >
  No comments yet.Be the first to share your thoughts.
                </p>
              )}

{/* ------------ COMMENT FORM ------------ */ }
{
  sessionStatus === "authenticated" ? (
    <form
                  className= "space-y-3"
                  onSubmit = { async(event: FormEvent) => {
    event.preventDefault();

    if (!commentContent.trim()) {
      showSnackbar("Please enter a comment before submitting.", {
        variant: "info",
      });
      return;
    }

    try {
      await addComment({
        variables: {
          postId: post.databaseId,
          content: commentContent,
          author: user?.displayName ?? user?.username,
          email: user?.email,
        },
      });

      setCommentContent("");
      showSnackbar("Comment submitted for review.", {
        variant: "success",
      });

      refetchPost();
    } catch (mutationError) {
      console.error(mutationError);
      showSnackbar("Could not submit comment.", { variant: "error" });
    }
  }
}
                >
  <textarea
                    className="min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-900 focus:outline-none"
placeholder = "Share your insight…"
value = { commentContent }
onChange = {(e) => setCommentContent(e.target.value)}
disabled = { postingComment }
  />

  <button
                    type="submit"
disabled = { postingComment }
className = "rounded-full bg-slate-900 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-slate-800 disabled:opacity-50"
  >
  { postingComment? "Sending…": "Post comment" }
  </button>
  </form>
              ) : (
  <p className= "text-sm text-slate-500" >
  <button
                    type="button"
onClick = {() => router.push("/login")}
className = "font-semibold text-slate-900 underline"
  >
  Log in
  </button>{" "}
                  to leave a comment.
                </p>
              )}
</section>

  </article>
  </PageSection>
  </PageWrapper>
  </main>
  );
}
