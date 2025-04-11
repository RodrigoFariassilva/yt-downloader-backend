import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import "./App.css";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function App() {
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [link, setLink] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadHistory(session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session) loadHistory(session.user.id);
        else setHistory([]);
      }
    );

    return () => listener?.subscription.unsubscribe();
  }, []);

  const signUp = async () => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) alert(error.message);
  };

  const signIn = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setHistory([]);
  };

  const handleDownload = async (type) => {
    if (!link) return alert("Cole o link do YouTube primeiro.");
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: link, type }),
      });

      const data = await res.json();

      if (data.downloadUrl) {
        const a = document.createElement("a");
        a.href = data.downloadUrl;
        a.download = "";
        a.click();

        if (session) {
          await supabase.from("history").insert([
            {
              user_id: session.user.id,
              url: link,
              type,
            },
          ]);
          loadHistory(session.user.id);
        }
      } else {
        alert("Erro ao processar o download.");
      }
    } catch (e) {
      alert("Erro no servidor.");
    }
    setLoading(false);
  };

  const loadHistory = async (user_id) => {
    const { data, error } = await supabase
      .from("history")
      .select("*")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });
    if (!error) setHistory(data);
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center p-6 gap-6">
      <h1 className="text-3xl font-bold">YouTube Downloader</h1>

      {!session ? (
        <div className="flex flex-col gap-3 w-full max-w-sm">
          <input
            type="email"
            placeholder="Email"
            className="p-2 rounded bg-zinc-800"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Senha"
            className="p-2 rounded bg-zinc-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={signIn} className="bg-green-600 px-4 py-2 rounded hover:bg-green-700 w-full">
              Entrar
            </button>
            <button onClick={signUp} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700 w-full">
              Criar conta
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xl">
            <input
              type="text"
              placeholder="Cole o link do YouTube aqui"
              className="p-2 flex-1 rounded bg-zinc-800"
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
            <button
              onClick={() => handleDownload("mp3")}
              className="bg-purple-600 px-4 py-2 rounded hover:bg-purple-700"
              disabled={loading}
            >
              Baixar MP3
            </button>
            <button
              onClick={() => handleDownload("mp4")}
              className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
              disabled={loading}
            >
              Baixar MP4
            </button>
          </div>

          <button
            onClick={signOut}
            className="text-sm text-zinc-400 hover:underline mt-4"
          >
            Sair da conta
          </button>

          <div className="mt-8 w-full max-w-xl">
            <h2 className="text-lg font-semibold mb-2">Histórico de downloads</h2>
            {history.length === 0 ? (
              <p className="text-zinc-400 text-sm">Nenhum download ainda.</p>
            ) : (
              <ul className="space-y-2">
                {history.map((item) => (
                  <li key={item.id} className="bg-zinc-800 p-2 rounded text-sm">
                    <span className="text-zinc-300">{item.url}</span> — {item.type.toUpperCase()}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
