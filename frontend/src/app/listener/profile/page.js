import ListenerProfileComponent from '../../Components/Listener/ListenerProfileComponent';
export default function Page() {
  return (
    <div style={{ padding: '32px 24px', maxWidth: '720px', margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>My Profile</h1>
      <ListenerProfileComponent />
    </div>
  );
}