import "./media.css";

export default function MediaPage() {
  return (
    <main className="media-page">
      <section className="media-card">
        <button className="close-button">×</button>

        <h1>Brilliant Talks by Women of Colour in STEM!</h1>

        <img
          className="media-image"
          src="/stem-talk.jpg"
          alt="Woman giving a STEM talk"
        />

        <div className="media-meta">
          <div className="user">
            <img className="avatar" src="/profphoto.png" alt="profile" />
            <strong>Shared by userNujabesus</strong>
          </div>

          <strong>Monday 9:15pm</strong>
        </div>

        <div className="tags">
          <span>Motivational</span>
          <span>Women of Colour</span>
        </div>

        <p className="description">
          I love this video because BLAH BLAH. I also went through this
          experience BLAH BLAH. I love this video because BLAH BLAH. I also
          went through this experience BLAH BLAH.
        </p>

        <h3>Discussion</h3>

        <div className="comment">
          <img className="avatar" src="/profphoto.png" alt="profile" />
          <div>
            <strong>ameliejzy</strong>
            <p>
              When she said ... it really made me view things from a more
              optimistic perspective!
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}