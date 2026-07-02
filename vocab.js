<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Học & Kiểm tra Từ vựng Tiếng Anh</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        .card-pop { animation: pop .25s ease; }
        @keyframes pop { 0%{transform:scale(.97);opacity:.6} 100%{transform:scale(1);opacity:1} }
        .shake { animation: shake .35s; }
        @keyframes shake { 10%,90%{transform:translateX(-2px)} 20%,80%{transform:translateX(4px)} 30%,50%,70%{transform:translateX(-8px)} 40%,60%{transform:translateX(8px)} }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-thumb { background: #c7d2fe; border-radius: 8px; }
    </style>
</head>
<body class="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect, useMemo } = React;

        const defaultWords = [
            { vi: "Trung tâm thể thao", en: "Sport Centre" },
            { vi: "Bánh mì kẹp", en: "Sandwich" },
            { vi: "Màu sắc", en: "Color" },
            { vi: "Đồ ăn / thức ăn", en: "Food" },
            { vi: "Cá heo", en: "Dolphin" },
            { vi: "Động vật", en: "Animal" },
            { vi: "Màu sắc yêu thích của bạn là gì?", en: "What is your favourite color?" },
            { vi: "Voi", en: "Elephant" },
            { vi: "Hổ", en: "Tiger" },
            { vi: "Sư Tử", en: "Lion" }
        ];

        const STORAGE_KEY = "vocab_app_custom_words_v1";

        function loadCustomWords() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                return raw ? JSON.parse(raw) : [];
            } catch (e) { return []; }
        }
        function saveCustomWords(words) {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(words)); } catch (e) {}
        }

        const QUIZ_STORAGE_KEY = "vocab_app_custom_quizzes_v1";

        function loadCustomQuizzes() {
            try {
                const raw = localStorage.getItem(QUIZ_STORAGE_KEY);
                return raw ? JSON.parse(raw) : [];
            } catch (e) { return []; }
        }
        function saveCustomQuizzes(quizzes) {
            try { localStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(quizzes)); } catch (e) {}
        }

        function generateHint(en) {
            return en.replace(/[a-zA-Z]+/g, (w) => w[0] + "_".repeat(Math.max(w.length - 1, 0)));
        }

        function shuffle(arr) {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        }

        function normalize(s) {
            return s.toLowerCase().replace(/[.?!]/g, "").trim();
        }

        // Dịch tiếng Anh sang tiếng Việt tự động (dùng khi người dùng để trống ô Tiếng Việt)
        async function autoTranslate(enWord) {
            try {
                const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(enWord)}&langpair=en|vi`);
                const data = await res.json();
                const text = data && data.responseData && data.responseData.translatedText;
                if (text && !/mymemory|invalid|query length/i.test(text)) {
                    return text.charAt(0).toUpperCase() + text.slice(1);
                }
                return "";
            } catch (e) { return ""; }
        }

        // Tìm hình ảnh phù hợp với từ tiếng Anh; nếu không có ảnh phù hợp, dùng ảnh có chứa chữ của từ đó
        function primaryImageUrl(enWord) {
            return `https://loremflickr.com/640/480/${encodeURIComponent(enWord.split(' ')[0])}?lock=${encodeURIComponent(enWord)}`;
        }
        function fallbackImageUrl(enWord) {
            return `https://placehold.co/640x480/6366f1/ffffff?font=inter&text=${encodeURIComponent(enWord)}`;
        }

        // ---------- Reusable UI bits ----------
        function TopBar({ title, onBack, right }) {
            return (
                <div className="flex items-center justify-between mb-6">
                    {onBack ? (
                        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white shadow flex items-center justify-center text-indigo-600 hover:bg-indigo-50 transition-colors">
                            <i className="fas fa-arrow-left"></i>
                        </button>
                    ) : <div className="w-10"></div>}
                    <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                    <div className="w-10 flex justify-end">{right}</div>
                </div>
            );
        }

        // ---------- Home Screen ----------
        function Home({ wordCount, quizCount, onStart, onAdd, onManage, onCreateQuiz, onMyQuizzes }) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="max-w-lg w-full">
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                                <i className="fas fa-graduation-cap text-3xl text-white"></i>
                            </div>
                            <h1 className="text-3xl font-extrabold text-gray-800">Học Từ Vựng</h1>
                            <p className="text-gray-500 mt-1">Đang có <span className="font-bold text-indigo-600">{wordCount}</span> từ trong kho từ vựng của bạn</p>
                        </div>

                        <div className="grid gap-4">
                            <button onClick={() => onStart('type')} className="group bg-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-4 text-left border-2 border-transparent hover:border-indigo-200">
                                <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl group-hover:scale-105 transition-transform">
                                    <i className="fas fa-keyboard"></i>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800">Gõ từ tiếng Anh</p>
                                    <p className="text-sm text-gray-500">Xem nghĩa tiếng Việt, gõ lại từ tiếng Anh</p>
                                </div>
                                <i className="fas fa-chevron-right text-gray-300"></i>
                            </button>

                            <button onClick={() => onStart('choice')} className="group bg-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-4 text-left border-2 border-transparent hover:border-purple-200">
                                <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 text-xl group-hover:scale-105 transition-transform">
                                    <i className="fas fa-list-check"></i>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800">Chọn nghĩa đúng</p>
                                    <p className="text-sm text-gray-500">Nhìn từ tiếng Anh, chọn nghĩa tiếng Việt đúng</p>
                                </div>
                                <i className="fas fa-chevron-right text-gray-300"></i>
                            </button>

                            <button onClick={() => onStart('image')} className="group bg-white p-5 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-4 text-left border-2 border-transparent hover:border-teal-200">
                                <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 text-xl group-hover:scale-105 transition-transform">
                                    <i className="fas fa-image"></i>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-800">Nhìn hình đoán từ</p>
                                    <p className="text-sm text-gray-500">Xem hình ảnh, gõ từ tiếng Anh phù hợp</p>
                                </div>
                                <i className="fas fa-chevron-right text-gray-300"></i>
                            </button>

                            <div className="grid grid-cols-2 gap-4 mt-2">
                                <button onClick={onAdd} className="bg-white p-4 rounded-2xl shadow hover:shadow-lg transition-all flex flex-col items-center gap-2 text-emerald-600 border-2 border-transparent hover:border-emerald-200">
                                    <i className="fas fa-plus-circle text-2xl"></i>
                                    <span className="font-semibold text-sm text-gray-700">Thêm từ mới</span>
                                </button>
                                <button onClick={onManage} className="bg-white p-4 rounded-2xl shadow hover:shadow-lg transition-all flex flex-col items-center gap-2 text-amber-600 border-2 border-transparent hover:border-amber-200">
                                    <i className="fas fa-list-ul text-2xl"></i>
                                    <span className="font-semibold text-sm text-gray-700">Quản lý từ đã thêm</span>
                                </button>
                            </div>

                            <div className="border-t border-gray-200 my-2 pt-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bộ đề riêng </p>
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={onCreateQuiz} className="bg-white p-4 rounded-2xl shadow hover:shadow-lg transition-all flex flex-col items-center gap-2 text-rose-600 border-2 border-transparent hover:border-rose-200">
                                        <i className="fas fa-wand-magic-sparkles text-2xl"></i>
                                        <span className="font-semibold text-sm text-gray-700">Tạo đề riêng</span>
                                    </button>
                                    <button onClick={onMyQuizzes} className="relative bg-white p-4 rounded-2xl shadow hover:shadow-lg transition-all flex flex-col items-center gap-2 text-sky-600 border-2 border-transparent hover:border-sky-200">
                                        {quizCount > 0 && <span className="absolute -top-2 -right-2 bg-sky-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">{quizCount}</span>}
                                        <i className="fas fa-layer-group text-2xl"></i>
                                        <span className="font-semibold text-sm text-gray-700">Bộ đề của tôi</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // ---------- Add Word Screen ----------
        function AddWord({ onBack, onSave }) {
            const [vi, setVi] = useState("");
            const [en, setEn] = useState("");
            const [hint, setHint] = useState("");
            const [justAdded, setJustAdded] = useState(false);
            const [translating, setTranslating] = useState(false);

            const submit = async (e) => {
                e.preventDefault();
                if (!en.trim() || translating) return;
                let finalVi = vi.trim();
                if (!finalVi) {
                    setTranslating(true);
                    finalVi = await autoTranslate(en.trim());
                    setTranslating(false);
                    if (!finalVi) { finalVi = en.trim(); }
                }
                onSave({ vi: finalVi, en: en.trim(), hint: (hint.trim() || generateHint(en.trim())) });
                setVi(""); setEn(""); setHint("");
                setJustAdded(true);
                setTimeout(() => setJustAdded(false), 1500);
            };

            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl max-w-lg w-full">
                        <TopBar title="Thêm từ mới" onBack={onBack} />

                        <form onSubmit={submit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Từ tiếng Anh</label>
                                <input value={en} onChange={e => setEn(e.target.value)} placeholder="VD: umbrella"
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Nghĩa tiếng Việt <span className="text-gray-400 font-normal">(để trống để tự động dịch)</span></label>
                                <input value={vi} onChange={e => setVi(e.target.value)} placeholder="VD: Cái ô / cây dù — hoặc để trống"
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Gợi ý (không bắt buộc)</label>
                                <input value={hint} onChange={e => setHint(e.target.value)} placeholder={en ? generateHint(en) : "Tự động tạo nếu để trống"}
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-500 transition-colors" />
                            </div>

                            <button type="submit" disabled={!en.trim() || translating}
                                className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg transition-all active:scale-95 disabled:opacity-60">
                                {translating ? <span><i className="fas fa-spinner fa-spin mr-2"></i>Đang tự động dịch...</span> :
                                 justAdded ? <span><i className="fas fa-check mr-2"></i>Đã thêm!</span> :
                                 <span><i className="fas fa-plus mr-2"></i>Thêm vào kho từ vựng</span>}
                            </button>
                        </form>
                    </div>
                </div>
            );
        }

        // ---------- Manage Words Screen ----------
        function ManageWords({ words, onBack, onDelete }) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl max-w-lg w-full">
                        <TopBar title={`Từ đã thêm (${words.length})`} onBack={onBack} />
                        {words.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <i className="fas fa-inbox text-4xl mb-3"></i>
                                <p>Bạn chưa thêm từ nào cả.</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                                {words.map((w, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                                        <div>
                                            <p className="font-bold text-gray-800">{w.en}</p>
                                            <p className="text-sm text-gray-500">{w.vi}</p>
                                        </div>
                                        <button onClick={() => onDelete(idx)} className="text-red-400 hover:text-red-600 w-9 h-9 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // ---------- Create Custom Quiz Screen ----------
        function CreateQuiz({ onBack, onSave }) {
            const [name, setName] = useState("");
            const [quizMode, setQuizMode] = useState("type");
            const [rows, setRows] = useState([{ en: "", vi: "", hint: "" }, { en: "", vi: "", hint: "" }]);
            const [error, setError] = useState("");
            const [saving, setSaving] = useState(false);

            const updateRow = (idx, field, value) => {
                setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: value } : r));
            };
            const addRow = () => setRows(prev => [...prev, { en: "", vi: "", hint: "" }]);
            const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

            const save = async () => {
                setError("");
                const cleanRows = rows
                    .map(r => ({ en: r.en.trim(), vi: r.vi.trim(), hint: r.hint.trim() }))
                    .filter(r => r.en);

                if (!name.trim()) { setError("Vui lòng đặt tên cho bộ đề."); return; }
                if (cleanRows.length < 2) { setError("Cần ít nhất 2 từ để tạo bộ đề."); return; }
                if (quizMode === 'choice' && cleanRows.length < 4) { setError("Chế độ 'Chọn nghĩa đúng' cần ít nhất 4 từ (để có đủ 4 đáp án)."); return; }

                setSaving(true);
                const finalRows = await Promise.all(cleanRows.map(async (r) => {
                    let vi = r.vi;
                    if (!vi) {
                        vi = await autoTranslate(r.en);
                        if (!vi) vi = r.en;
                    }
                    return { en: r.en, vi, hint: r.hint || generateHint(r.en) };
                }));
                setSaving(false);

                const quiz = { id: Date.now().toString(), name: name.trim(), mode: quizMode, words: finalRows };
                onSave(quiz);
            };

            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl max-w-2xl w-full">
                        <TopBar title="Tạo bộ đề riêng" onBack={onBack} />

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1">Tên bộ đề</label>
                                <input value={name} onChange={e => setName(e.target.value)} placeholder="VD: Từ vựng chủ đề gia đình"
                                    className="w-full p-3 border-2 border-gray-200 rounded-xl outline-none focus:border-rose-400 transition-colors" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">Kiểu câu hỏi</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button type="button" onClick={() => setQuizMode('type')}
                                        className={`p-3 rounded-xl border-2 font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all ${quizMode === 'type' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 text-gray-500'}`}>
                                        <i className="fas fa-keyboard"></i> Điền từ
                                    </button>
                                    <button type="button" onClick={() => setQuizMode('choice')}
                                        className={`p-3 rounded-xl border-2 font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all ${quizMode === 'choice' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500'}`}>
                                        <i className="fas fa-list-check"></i> Chọn nghĩa
                                    </button>
                                    <button type="button" onClick={() => setQuizMode('image')}
                                        className={`p-3 rounded-xl border-2 font-semibold text-xs flex flex-col items-center justify-center gap-1 transition-all ${quizMode === 'image' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-500'}`}>
                                        <i className="fas fa-image"></i> Nhìn hình
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-semibold text-gray-600">Danh sách từ ({rows.length})</label>
                                <button onClick={addRow} className="text-sm font-semibold text-rose-600 hover:text-rose-700">
                                    <i className="fas fa-plus mr-1"></i>Thêm dòng
                                </button>
                            </div>
                            <p className="text-xs text-gray-400 mb-2">Bỏ trống ô Tiếng Việt để hệ thống tự động dịch khi lưu.</p>
                            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                {rows.map((row, idx) => (
                                    <div key={idx} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center bg-gray-50 p-2 rounded-xl">
                                        <input value={row.en} onChange={e => updateRow(idx, 'en', e.target.value)} placeholder="Tiếng Anh"
                                            className="p-2 border border-gray-200 rounded-lg outline-none focus:border-rose-400 text-sm" />
                                        <input value={row.vi} onChange={e => updateRow(idx, 'vi', e.target.value)} placeholder="Tiếng Việt (để trống = tự dịch)"
                                            className="p-2 border border-gray-200 rounded-lg outline-none focus:border-rose-400 text-sm" />
                                        <button onClick={() => removeRow(idx)} disabled={rows.length <= 2}
                                            className="w-9 h-9 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-500 mt-3"><i className="fas fa-circle-exclamation mr-1"></i>{error}</p>}

                        <button onClick={save} disabled={saving}
                            className="w-full mt-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-lg transition-all active:scale-95 disabled:opacity-60">
                            {saving ? <span><i className="fas fa-spinner fa-spin mr-2"></i>Đang dịch & lưu...</span> : <span><i className="fas fa-floppy-disk mr-2"></i>Lưu bộ đề</span>}
                        </button>
                    </div>
                </div>
            );
        }

        // ---------- My Quizzes Screen ----------
        function MyQuizzes({ quizzes, onBack, onPlay, onDelete }) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl max-w-lg w-full">
                        <TopBar title={`Bộ đề của tôi (${quizzes.length})`} onBack={onBack} />
                        {quizzes.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <i className="fas fa-layer-group text-4xl mb-3"></i>
                                <p>Bạn chưa tạo bộ đề nào cả.</p>
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                                {quizzes.map((q) => (
                                    <div key={q.id} className="bg-gray-50 p-4 rounded-xl">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-bold text-gray-800">{q.name}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    <i className={`fas ${q.mode === 'type' ? 'fa-keyboard' : q.mode === 'choice' ? 'fa-list-check' : 'fa-image'} mr-1`}></i>
                                                    {q.mode === 'type' ? 'Điền từ' : q.mode === 'choice' ? 'Chọn nghĩa đúng' : 'Nhìn hình đoán từ'} · {q.words.length} từ
                                                </p>
                                            </div>
                                            <button onClick={() => onDelete(q.id)} className="text-red-400 hover:text-red-600 w-9 h-9 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0">
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                        <button onClick={() => onPlay(q)}
                                            className="w-full mt-3 py-2 rounded-lg font-semibold text-sm text-white bg-sky-500 hover:bg-sky-600 transition-colors">
                                            <i className="fas fa-play mr-2"></i>Bắt đầu ôn tập
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // ---------- Quiz: Type mode ----------
        function TypeQuiz({ list, onFinish, onExit }) {
            const [idx, setIdx] = useState(0);
            const [input, setInput] = useState("");
            const [feedback, setFeedback] = useState(null);
            const [score, setScore] = useState(0);
            const [history, setHistory] = useState([]);

            const current = list[idx];
            const progress = ((idx + 1) / list.length) * 100;

            const submit = (e) => {
                e.preventDefault();
                if (!input.trim() || feedback) return;
                const isCorrect = normalize(input) === normalize(current.en);
                if (isCorrect) setScore(s => s + 1);
                setFeedback(isCorrect ? 'correct' : 'wrong');
                const newHistory = [...history, { ...current, userInput: input, isCorrect, mode: 'type' }];
                setHistory(newHistory);

                setTimeout(() => {
                    if (idx < list.length - 1) {
                        setIdx(i => i + 1);
                        setInput("");
                        setFeedback(null);
                    } else {
                        onFinish(isCorrect ? score + 1 : score, newHistory);
                    }
                }, 1500);
            };

            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl max-w-lg w-full card-pop">
                        <TopBar title="Gõ từ tiếng Anh" onBack={onExit} />
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                            <div className="bg-indigo-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Câu {idx + 1} / {list.length}</span>
                            <span className="text-sm font-bold text-indigo-600">Đúng: {score}</span>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-sm text-gray-500 mb-2">Dịch sang tiếng Anh:</h3>
                            <p className="text-2xl font-bold text-gray-800 leading-tight">{current.vi}</p>
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={feedback !== null}
                                    autoFocus
                                    placeholder="Nhập câu trả lời..."
                                    className={`w-full p-4 border-2 rounded-xl text-lg outline-none transition-all ${
                                        feedback === 'correct' ? 'border-green-500 bg-green-50' :
                                        feedback === 'wrong' ? 'border-red-500 bg-red-50 shake' :
                                        'border-gray-200 focus:border-indigo-500'
                                    }`}
                                />
                                <p className="mt-2 text-sm text-gray-400 italic">Gợi ý: {current.hint || generateHint(current.en)}</p>
                            </div>

                            <button type="submit" disabled={feedback !== null || !input.trim()}
                                className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${
                                    feedback === 'correct' ? 'bg-green-500' :
                                    feedback === 'wrong' ? 'bg-red-500' :
                                    'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
                                }`}>
                                {feedback === 'correct' ? <span><i className="fas fa-check mr-2"></i>Chính xác!</span> :
                                 feedback === 'wrong' ? <span><i className="fas fa-times mr-2"></i>Sai rồi! Đáp án: {current.en}</span> :
                                 "Kiểm tra"}
                            </button>
                        </form>
                        <p className="mt-6 text-center text-xs text-gray-400">Nhấn <span className="font-bold">Enter</span> để kiểm tra nhanh</p>
                    </div>
                </div>
            );
        }

        // ---------- Quiz: Choice mode ----------
        function ChoiceQuiz({ list, pool, onFinish, onExit }) {
            const [idx, setIdx] = useState(0);
            const [selected, setSelected] = useState(null);
            const [score, setScore] = useState(0);
            const [history, setHistory] = useState([]);

            const current = list[idx];
            const progress = ((idx + 1) / list.length) * 100;

            const options = useMemo(() => {
                const others = shuffle(pool.filter(w => w.vi !== current.vi)).slice(0, 3).map(w => w.vi);
                return shuffle([current.vi, ...others]);
            }, [idx]);

            const pick = (opt) => {
                if (selected) return;
                const isCorrect = opt === current.vi;
                setSelected(opt);
                if (isCorrect) setScore(s => s + 1);
                const newHistory = [...history, { ...current, userInput: opt, isCorrect, mode: 'choice' }];
                setHistory(newHistory);

                setTimeout(() => {
                    if (idx < list.length - 1) {
                        setIdx(i => i + 1);
                        setSelected(null);
                    } else {
                        onFinish(isCorrect ? score + 1 : score, newHistory);
                    }
                }, 1200);
            };

            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl max-w-lg w-full card-pop">
                        <TopBar title="Chọn nghĩa đúng" onBack={onExit} />
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                            <div className="bg-purple-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Câu {idx + 1} / {list.length}</span>
                            <span className="text-sm font-bold text-purple-600">Đúng: {score}</span>
                        </div>

                        <div className="mb-8 text-center">
                            <h3 className="text-sm text-gray-500 mb-2">Từ này có nghĩa là gì?</h3>
                            <p className="text-3xl font-extrabold text-gray-800">{current.en}</p>
                        </div>

                        <div className="grid gap-3">
                            {options.map((opt, i) => {
                                let style = 'border-gray-200 hover:border-purple-300 bg-white';
                                if (selected) {
                                    if (opt === current.vi) style = 'border-green-500 bg-green-50 text-green-700';
                                    else if (opt === selected) style = 'border-red-500 bg-red-50 text-red-700 shake';
                                    else style = 'border-gray-100 bg-gray-50 text-gray-400';
                                }
                                return (
                                    <button key={i} onClick={() => pick(opt)} disabled={selected !== null}
                                        className={`p-4 rounded-xl border-2 text-left font-semibold transition-all ${style}`}>
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );
        }

        // ---------- Quiz: Image mode ----------
        function ImageQuiz({ list, onFinish, onExit }) {
            const [idx, setIdx] = useState(0);
            const [input, setInput] = useState("");
            const [feedback, setFeedback] = useState(null);
            const [score, setScore] = useState(0);
            const [history, setHistory] = useState([]);
            const [useFallback, setUseFallback] = useState(false);
            const [imgLoading, setImgLoading] = useState(true);

            const current = list[idx];
            const progress = ((idx + 1) / list.length) * 100;
            const imgSrc = useFallback ? fallbackImageUrl(current.en) : primaryImageUrl(current.en);

            useEffect(() => { setUseFallback(false); setImgLoading(true); }, [idx]);

            const submit = (e) => {
                e.preventDefault();
                if (!input.trim() || feedback) return;
                const isCorrect = normalize(input) === normalize(current.en);
                if (isCorrect) setScore(s => s + 1);
                setFeedback(isCorrect ? 'correct' : 'wrong');
                const newHistory = [...history, { ...current, userInput: input, isCorrect, mode: 'image' }];
                setHistory(newHistory);

                setTimeout(() => {
                    if (idx < list.length - 1) {
                        setIdx(i => i + 1);
                        setInput("");
                        setFeedback(null);
                    } else {
                        onFinish(isCorrect ? score + 1 : score, newHistory);
                    }
                }, 1500);
            };

            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl max-w-lg w-full card-pop">
                        <TopBar title="Nhìn hình đoán từ" onBack={onExit} />
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                            <div className="bg-teal-600 h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Câu {idx + 1} / {list.length}</span>
                            <span className="text-sm font-bold text-teal-600">Đúng: {score}</span>
                        </div>

                        <div className="mb-6 relative rounded-xl overflow-hidden bg-gray-100 aspect-[4/3] flex items-center justify-center">
                            {imgLoading && <div className="absolute inset-0 flex items-center justify-center text-gray-300"><i className="fas fa-spinner fa-spin text-3xl"></i></div>}
                            <img
                                key={imgSrc}
                                src={imgSrc}
                                alt="Đoán từ tiếng Anh"
                                onLoad={() => setImgLoading(false)}
                                onError={() => { if (!useFallback) { setUseFallback(true); } else { setImgLoading(false); } }}
                                className={`w-full h-full object-cover transition-opacity ${imgLoading ? 'opacity-0' : 'opacity-100'}`}
                            />
                        </div>

                        <form onSubmit={submit} className="space-y-6">
                            <div>
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    disabled={feedback !== null}
                                    autoFocus
                                    placeholder="Đây là từ gì trong tiếng Anh?"
                                    className={`w-full p-4 border-2 rounded-xl text-lg outline-none transition-all ${
                                        feedback === 'correct' ? 'border-green-500 bg-green-50' :
                                        feedback === 'wrong' ? 'border-red-500 bg-red-50 shake' :
                                        'border-gray-200 focus:border-teal-500'
                                    }`}
                                />
                                <p className="mt-2 text-sm text-gray-400 italic">Gợi ý: {current.hint || generateHint(current.en)}</p>
                            </div>

                            <button type="submit" disabled={feedback !== null || !input.trim()}
                                className={`w-full py-4 rounded-xl font-bold text-white text-lg shadow-lg transition-all ${
                                    feedback === 'correct' ? 'bg-green-500' :
                                    feedback === 'wrong' ? 'bg-red-500' :
                                    'bg-teal-600 hover:bg-teal-700 active:scale-95'
                                }`}>
                                {feedback === 'correct' ? <span><i className="fas fa-check mr-2"></i>Chính xác!</span> :
                                 feedback === 'wrong' ? <span><i className="fas fa-times mr-2"></i>Sai rồi! Đáp án: {current.en}</span> :
                                 "Kiểm tra"}
                            </button>
                        </form>
                        <p className="mt-6 text-center text-xs text-gray-400">Nhấn <span className="font-bold">Enter</span> để kiểm tra nhanh</p>
                    </div>
                </div>
            );
        }

        // ---------- Result Screen ----------
        function Result({ score, total, history, onRestart, onHome }) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl w-full text-center card-pop">
                        <h2 className="text-3xl font-bold mb-2 text-indigo-600">Kết quả bài kiểm tra</h2>
                        <p className="text-gray-500 mb-4">{score === total ? "Xuất sắc! Bạn đã trả lời đúng hết! 🎉" : "Cố lên, luyện tập thêm nhé!"}</p>
                        <div className="text-6xl font-bold mb-6 text-gray-800">{score} / {total}</div>
                        <div className="space-y-3 mb-8 text-left max-h-96 overflow-y-auto p-4 border rounded-lg">
                            {history.map((item, idx) => (
                                <div key={idx} className={`p-3 rounded-lg ${item.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <p className="font-semibold text-gray-700">{idx + 1}. {item.mode === 'choice' ? item.en : item.mode === 'image' ? `🖼️ ${item.vi}` : item.vi}</p>
                                    <p className="text-sm">Bạn chọn/nhập: <span className={item.isCorrect ? 'text-green-600' : 'text-red-600'}>{item.userInput || "(Để trống)"}</span></p>
                                    {!item.isCorrect && <p className="text-sm text-gray-600">Đáp án đúng: <span className="font-medium text-green-700">{item.mode === 'choice' ? item.vi : item.en}</span></p>}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button onClick={onHome} className="bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-semibold hover:bg-gray-200 transition-colors">
                                <i className="fas fa-house mr-2"></i>Trang chủ
                            </button>
                            <button onClick={onRestart} className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition-colors">
                                <i className="fas fa-rotate-right mr-2"></i>Thử lại
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // ---------- App Root ----------
        function App() {
            const [customWords, setCustomWords] = useState(() => loadCustomWords());
            const [customQuizzes, setCustomQuizzes] = useState(() => loadCustomQuizzes());
            const [screen, setScreen] = useState('home');
            const [mode, setMode] = useState('type');
            const [quizList, setQuizList] = useState([]);
            const [quizPool, setQuizPool] = useState([]);
            const [activeQuiz, setActiveQuiz] = useState(null); // custom quiz object, or null for the general pool
            const [result, setResult] = useState({ score: 0, total: 0, history: [] });

            const allWords = useMemo(() => [...defaultWords, ...customWords], [customWords]);

            useEffect(() => { saveCustomWords(customWords); }, [customWords]);
            useEffect(() => { saveCustomQuizzes(customQuizzes); }, [customQuizzes]);

            const startQuiz = (chosenMode) => {
                setActiveQuiz(null);
                setMode(chosenMode);
                setQuizList(shuffle(allWords));
                setQuizPool(allWords);
                setScreen('quiz');
            };

            const playCustomQuiz = (quiz) => {
                setActiveQuiz(quiz);
                setMode(quiz.mode);
                setQuizList(shuffle(quiz.words));
                setQuizPool(quiz.words);
                setScreen('quiz');
            };

            const restartQuiz = () => {
                if (activeQuiz) playCustomQuiz(activeQuiz);
                else startQuiz(mode);
            };

            const finishQuiz = (score, history) => {
                setResult({ score, total: quizList.length, history });
                setScreen('result');
            };

            const addWord = (word) => setCustomWords(prev => [...prev, word]);
            const deleteWord = (idx) => setCustomWords(prev => prev.filter((_, i) => i !== idx));

            const addQuiz = (quiz) => { setCustomQuizzes(prev => [...prev, quiz]); setScreen('my-quizzes'); };
            const deleteQuiz = (id) => setCustomQuizzes(prev => prev.filter(q => q.id !== id));

            switch (screen) {
                case 'add':
                    return <AddWord onBack={() => setScreen('home')} onSave={(w) => { addWord(w); }} />;
                case 'manage':
                    return <ManageWords words={customWords} onBack={() => setScreen('home')} onDelete={deleteWord} />;
                case 'create-quiz':
                    return <CreateQuiz onBack={() => setScreen('home')} onSave={addQuiz} />;
                case 'my-quizzes':
                    return <MyQuizzes quizzes={customQuizzes} onBack={() => setScreen('home')} onPlay={playCustomQuiz} onDelete={deleteQuiz} />;
                case 'quiz':
                    return mode === 'type'
                        ? <TypeQuiz list={quizList} onFinish={finishQuiz} onExit={() => setScreen('home')} />
                        : mode === 'choice'
                        ? <ChoiceQuiz list={quizList} pool={quizPool} onFinish={finishQuiz} onExit={() => setScreen('home')} />
                        : <ImageQuiz list={quizList} onFinish={finishQuiz} onExit={() => setScreen('home')} />;
                case 'result':
                    return <Result {...result} onRestart={restartQuiz} onHome={() => setScreen('home')} />;
                default:
                    return <Home wordCount={allWords.length} quizCount={customQuizzes.length} onStart={startQuiz}
                        onAdd={() => setScreen('add')} onManage={() => setScreen('manage')}
                        onCreateQuiz={() => setScreen('create-quiz')} onMyQuizzes={() => setScreen('my-quizzes')} />;
            }
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>
