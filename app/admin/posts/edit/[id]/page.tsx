import PostEditor from '../../../../../components/admin/PostEditor';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  return <PostEditor postId={(await params).id} />;
}
