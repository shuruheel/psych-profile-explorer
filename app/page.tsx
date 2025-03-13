import ProfileViewer from "@/components/profile-viewer"

export default function Home() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Psychological Profile Explorer</h1>
      <ProfileViewer />
    </div>
  )
}

