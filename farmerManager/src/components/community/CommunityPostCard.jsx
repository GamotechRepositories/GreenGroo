import { useState } from "react";
import { Award, HelpCircle, MessageSquare, Send, ThumbsUp } from "lucide-react";
import { EXCEL_BTN, EXCEL_BTN_PRIMARY, EXCEL_INPUT, EXCEL_PANEL } from "../../utils/excelStyles";

export default function CommunityPostCard({ post, onLikePost, onAddComment }) {
  const [showComments, setShowComments] = useState(true);
  const [replyText, setReplyText] = useState("");

  const handleSendComment = (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    onAddComment(post.id, {
      id: `comment-${Date.now()}`,
      author: "You (शेतकरी)",
      authorRole: "Farmer",
      isExpert: false,
      location: "Local Farmer",
      timeAgo: "Just now",
      content: replyText.trim(),
      likes: 0,
    });

    setReplyText("");
  };

  return (
    <div className={`${EXCEL_PANEL} overflow-hidden shadow-2xs`}>
      {/* Post Author Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-[#F9F9F9] p-3">
        <div className="flex items-center gap-2.5">
          {post.authorAvatar ? (
            <img
              src={post.authorAvatar}
              alt={post.author}
              className="h-9 w-9 rounded-full object-cover border border-slate-300"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-emerald-100 text-xs font-bold text-emerald-800">
              {(post.author || "F")
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0]?.toUpperCase())
                .join("")}
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs text-slate-900">{post.author}</span>
              {post.isExpert ? (
                <span className="inline-flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[9.5px] font-extrabold text-white">
                  <Award className="h-3 w-3" />
                  {post.expertBadge || "Agri Expert"}
                </span>
              ) : null}
            </div>
            <p className="text-[10.5px] font-medium text-slate-500">
              {post.authorRole} • {post.location} • {post.timeAgo}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5">
          {post.isQuestion ? (
            <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-[10.5px] font-bold text-amber-900 border border-amber-300">
              <HelpCircle className="h-3 w-3 text-amber-700" />
              Q&A Question
            </span>
          ) : null}
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-800">
            {post.category}
          </span>
          {post.cropTag ? (
            <span className="rounded bg-slate-200 px-2 py-0.5 text-[10.5px] font-semibold text-slate-700">
              {post.cropTag}
            </span>
          ) : null}
        </div>
      </div>

      {/* Post Content */}
      <div className="p-3.5 space-y-2.5">
        <h2 className="text-sm font-bold text-slate-900 leading-snug">{post.title}</h2>
        <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{post.content}</p>

        {/* Attached Photo */}
        {post.image ? (
          <div className="mt-2.5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <img
              src={post.image}
              alt={post.title}
              className="max-h-[380px] w-full object-cover"
              loading="lazy"
            />
          </div>
        ) : null}

        {/* Action Bar (Likes & Comments Count) */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onLikePost(post.id)}
              className={`flex items-center gap-1.5 font-semibold transition ${
                post.userLiked ? "text-emerald-700 font-bold" : "hover:text-emerald-700"
              }`}
            >
              <ThumbsUp className={`h-4 w-4 ${post.userLiked ? "fill-emerald-600 text-emerald-600" : ""}`} />
              <span>{post.likes} Helpful</span>
            </button>

            <button
              type="button"
              onClick={() => setShowComments((prev) => !prev)}
              className="flex items-center gap-1.5 font-semibold hover:text-emerald-700"
            >
              <MessageSquare className="h-4 w-4 text-slate-500" />
              <span>{post.comments?.length || post.commentsCount} Answers & Replies</span>
            </button>
          </div>

          <span className="text-[11px] font-medium text-slate-400">
            Language: {post.language === "mr" ? "मराठी" : post.language === "hi" ? "हिंदी" : "English"}
          </span>
        </div>

        {/* Comments & Expert Advice Section */}
        {showComments ? (
          <div className="mt-3 space-y-2.5 border-t border-slate-100 pt-3">
            {post.comments && post.comments.length > 0 ? (
              <div className="space-y-2">
                {post.comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`rounded-lg p-2.5 border transition ${
                      comment.isExpert
                        ? "border-emerald-300 bg-emerald-50/80 shadow-xs"
                        : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900">{comment.author}</span>
                        {comment.isExpert ? (
                          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-700 px-1.5 py-0.5 text-[9.5px] font-extrabold text-white">
                            <Award className="h-3 w-3" />
                            {comment.expertBadge || "Expert Advice 🌾"}
                          </span>
                        ) : null}
                      </div>
                      <span className="text-[10px] text-slate-500">{comment.timeAgo}</span>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed">{comment.content}</p>

                    <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-slate-500">
                      <span>{comment.location}</span>
                      <span className="font-medium text-emerald-800">👍 {comment.likes} Farmers found useful</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-xs text-slate-500 py-1">
                No replies yet. Be the first farmer or expert to answer!
              </p>
            )}

            {/* Reply / Comment Form */}
            <form onSubmit={handleSendComment} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write an advice or reply in Marathi / English / Hindi..."
                className={`${EXCEL_INPUT} flex-1`}
              />
              <button type="submit" className={`${EXCEL_BTN_PRIMARY} inline-flex items-center gap-1 shrink-0`}>
                <Send className="h-3.5 w-3.5" />
                <span>Reply</span>
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
