import { useMemo, useState } from "react";
import { Filter, Globe, HelpCircle, MessageSquarePlus, Search, Users } from "lucide-react";
import { COMMUNITY_CATEGORIES, COMMUNITY_LANGUAGES, INITIAL_COMMUNITY_POSTS } from "../data/farmerCommunityData";
import CommunityPostCard from "../components/community/CommunityPostCard";
import AskExpertSection from "../components/community/AskExpertSection";
import CreatePostModal from "../components/community/CreatePostModal";
import StatCard from "../components/ui/StatCard";
import {
  EXCEL_BTN,
  EXCEL_BTN_PRIMARY,
  EXCEL_INPUT,
  EXCEL_PAGE_SUB,
  EXCEL_PAGE_TITLE,
  EXCEL_PANEL,
  EXCEL_PANEL_HEAD,
  EXCEL_SELECT,
} from "../utils/excelStyles";

export default function FarmerCommunityPage() {
  const [posts, setPosts] = useState(INITIAL_COMMUNITY_POSTS);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory =
        selectedCategory === "All" || post.category === selectedCategory;
      const matchesLanguage =
        selectedLanguage === "all" || post.language === selectedLanguage;
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (post.cropTag && post.cropTag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        post.author.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesLanguage && matchesSearch;
    });
  }, [posts, selectedCategory, selectedLanguage, searchQuery]);

  // Handle Like Post
  const handleLikePost = (postId) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const userLiked = !p.userLiked;
          return {
            ...p,
            userLiked,
            likes: userLiked ? p.likes + 1 : p.likes - 1,
          };
        }
        return p;
      })
    );
  };

  // Handle Add Comment / Reply
  const handleAddComment = (postId, newComment) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            commentsCount: p.commentsCount + 1,
            comments: [...(p.comments || []), newComment],
          };
        }
        return p;
      })
    );
  };

  // Handle Create New Post
  const handleCreatePost = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  return (
    <div className="space-y-4">
      {/* Page Title Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className={EXCEL_PAGE_TITLE}>Farmer Community & Expert Advisory (शेतकरी चर्चा व मार्गदर्शन)</h1>
          <p className={EXCEL_PAGE_SUB}>
            Discussion Forum, Agriculture Q&A, Knowledge & Photo Sharing, and Local Language Support
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className={`${EXCEL_BTN_PRIMARY} inline-flex items-center gap-1.5 font-bold shadow-xs`}
        >
          <MessageSquarePlus className="h-4 w-4" />
          <span>Ask Question / Post (प्रश्न विचारा)</span>
        </button>
      </div>

      {/* Ask Expert Banner */}
      <AskExpertSection onOpenAskModal={() => setIsModalOpen(true)} />

      {/* Summary Stats */}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Active Discussions" value={posts.length} />
        <StatCard title="Expert Answers" value={posts.reduce((acc, p) => acc + (p.comments?.filter(c => c.isExpert).length || 0), 0)} />
        <StatCard title="Community Farmers" value={new Set(posts.map((p) => p.author)).size} />
        <StatCard title="Languages Supported" value="मराठी • English • हिंदी" />
      </div>

      {/* Filters & Language Bar */}
      <section className={EXCEL_PANEL}>
        <div className={`${EXCEL_PANEL_HEAD} flex flex-wrap items-center justify-between gap-2`}>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[#217346]" />
            <span className="font-bold text-[#1F2937]">Filter Community Discussions</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search topics, crops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${EXCEL_INPUT} pl-7 w-40 sm:w-56`}
              />
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Language Selector */}
            <div className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-slate-500 hidden sm:inline-block" />
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className={EXCEL_SELECT}
              >
                {COMMUNITY_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="p-3 border-b border-slate-100 bg-[#F9F9F9]">
          <div className="flex flex-wrap items-center gap-1.5">
            {COMMUNITY_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                  selectedCategory === cat
                    ? "bg-[#217346] text-white shadow-xs"
                    : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Community Feed List */}
        <div className="p-3 space-y-3.5">
          {filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              {posts.length === 0
                ? "No community posts yet. Ask a question to start a discussion."
                : "No community posts match your selected filter or language."}
            </div>
          ) : (
            filteredPosts.map((post) => (
              <CommunityPostCard
                key={post.id}
                post={post}
                onLikePost={handleLikePost}
                onAddComment={handleAddComment}
              />
            ))
          )}
        </div>
      </section>

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitPost={handleCreatePost}
      />
    </div>
  );
}
