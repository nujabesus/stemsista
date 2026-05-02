"use client";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#f7f0dd] text-black px-10 py-6">
      <h1 className="text-xl text-gray-300 mb-6">My Profile</h1>

      <section className="flex items-center gap-8 mb-10">
        <div className="h-44 w-44 rounded-full bg-[#7d68d8] flex items-center justify-center text-white text-6xl font-black">
          A
        </div>

        <div>
          <p className="font-bold text-lg">Profile</p>
          <h2 className="text-5xl font-black">ameliejzy</h2>
          <p className="text-gray-500 font-bold mt-3">
            12 Saved • 21 Friends
          </p>
        </div>
      </section>

      <h2 className="text-5xl font-black text-center mb-10">
        My Catalogue
      </h2>

      <section className="grid grid-cols-3 gap-x-24 gap-y-16 px-20">
        <Card title="Jenny read 5 minutes ago..." />
        <Card title="Amy watched 23 hours ago..." />
        <Card title="Alicia watched 2 days ago..." />
        <Card title="" />
        <Card title="" />
        <Card title="" />
      </section>
    </main>
  );
}

function Card({ title }: { title: string }) {
  return (
    <article>
      <div className="w-full h-64 bg-gray-300" />
      {title && (
        <p className="font-black text-center mt-4 text-lg">{title}</p>
      )}
    </article>
  );
}