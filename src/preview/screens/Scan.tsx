/**
 * Scan — visée (simulation caméra), capture d'une photo d'exemple,
 * import depuis la galerie, diamètre d'assiette + contexte facultatif.
 * (Miroir de mobile/app/scan.tsx qui utilise expo-camera / expo-image-picker)
 */
import { useRef, useState } from "react";
import { PLATE_DIAMETERS_CM } from "../../../mobile/constants/nutrition";
import { SAMPLE_MEALS } from "../assets";
import { Icon } from "../Icon";
import { useNav } from "../shell";
import { Screen } from "../ui";
import { cn } from "../../utils/cn";

export function ScanScreen() {
  const nav = useNav();
  const fileRef = useRef<HTMLInputElement>(null);
  const [shotIndex, setShotIndex] = useState(0);
  const [photo, setPhoto] = useState<{ uri: string; sampleKey?: string } | null>(null);
  const [diametre, setDiametre] = useState<number | null>(null);
  const [contexte, setContexte] = useState("");

  const capture = () => {
    const sample = SAMPLE_MEALS[shotIndex % SAMPLE_MEALS.length];
    setPhoto({ uri: sample.src, sampleKey: sample.key });
    setShotIndex((i) => i + 1);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setPhoto({ uri: URL.createObjectURL(f) });
  };

  const analyze = () => {
    if (!photo) return;
    nav.push({
      name: "analysis",
      input: {
        mode: "photo",
        uri: photo.uri,
        sampleKey: photo.sampleKey,
        ...(diametre != null ? { diametre } : {}),
        ...(contexte.trim() ? { contexte: contexte.trim() } : {}),
      },
    });
  };

  const darkBtn = "flex h-10 w-10 items-center justify-center rounded-full border border-shell-600 bg-shell-800 text-[#F2F6EC] transition-all hover:border-shell-500 active:scale-90";

  return (
    <Screen dark padded={false} className="flex flex-col">
      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 pb-5 pt-4 no-scrollbar">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <button onClick={() => nav.pop()} className={darkBtn} aria-label="Retour">
            <Icon name="chevron-left" size={18} strokeWidth={2.5} />
          </button>
          <h1 className="font-display text-[16.5px] font-extrabold tracking-tight">Scanner un repas</h1>
          <button onClick={() => fileRef.current?.click()} className={cn(darkBtn, "text-lime-glow")} aria-label="Galerie">
            <Icon name="gallery" size={17} />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
        </div>

        {photo ? (
          <>
            <div className="anim-pop overflow-hidden rounded-[26px] border border-shell-600">
              <img src={photo.uri} alt="Photo du repas" className="h-[300px] w-full object-cover" />
            </div>

            {/* Options */}
            <div className="rounded-[22px] border border-shell-600 bg-shell-800 p-4">
              <p className="mb-2 text-[11px] font-extrabold tracking-wide text-shell-300">DIAMÈTRE DE L'ASSIETTE · OPTIONNEL</p>
              <div className="grid grid-cols-4 gap-2">
                {PLATE_DIAMETERS_CM.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiametre(diametre === d ? null : d)}
                    className={cn(
                      "tnum rounded-[12px] border py-2.5 text-[13px] font-bold transition-all active:scale-95",
                      diametre === d ? "border-lime-glow bg-lime-glow text-lime-ink" : "border-shell-600 bg-shell-900 text-shell-300 hover:border-shell-500"
                    )}
                  >
                    {d} cm
                  </button>
                ))}
              </div>
              <p className="mb-2 mt-3.5 text-[11px] font-extrabold tracking-wide text-shell-300">CONTEXTE · FACULTATIF</p>
              <input
                value={contexte}
                onChange={(e) => setContexte(e.target.value)}
                placeholder="ex. dîner après le sport, restaurant…"
                className="w-full rounded-[12px] border border-shell-600 bg-shell-900 px-3.5 py-3 text-[13.5px] font-medium text-[#F2F6EC] outline-none placeholder:text-shell-400 focus:border-lime-glow/60"
              />
            </div>

            <button
              onClick={analyze}
              className="flex items-center justify-center gap-2 rounded-[18px] bg-pine py-4 text-[15.5px] font-extrabold text-[#F4F8EE] transition-all hover:bg-pine-2 active:scale-[0.98]"
            >
              <Icon name="sparkles" size={17} /> Analyser ce repas
            </button>
            <button onClick={() => setPhoto(null)} className="flex items-center justify-center gap-2 rounded-[18px] border border-shell-600 py-3 text-[14px] font-bold text-shell-200 transition-all hover:bg-shell-800 active:scale-[0.98]">
              <Icon name="refresh" size={15} /> Reprendre
            </button>
          </>
        ) : (
          <>
            {/* Viseur simulé */}
            <div className="relative flex-1 overflow-hidden rounded-[26px] border border-shell-600 bg-[radial-gradient(circle_at_50%_35%,#22372a,#101b14_70%)]" style={{ minHeight: 320 }}>
              {/* grille des tiers */}
              <div className="pointer-events-none absolute inset-y-0 left-1/3 w-px bg-white/10" />
              <div className="pointer-events-none absolute inset-y-0 left-2/3 w-px bg-white/10" />
              <div className="pointer-events-none absolute inset-x-0 top-1/3 h-px bg-white/10" />
              <div className="pointer-events-none absolute inset-x-0 top-2/3 h-px bg-white/10" />
              <div className="pointer-events-none absolute inset-3.5 rounded-[20px] border-[1.5px] border-lime-glow/50" />
              {/* ligne de balayage */}
              <div className="anim-scanline pointer-events-none absolute left-6 right-6 h-[3px] rounded-full bg-lime-glow shadow-[0_0_14px_2px_rgba(200,241,105,0.55)]" />
              <div className="absolute inset-x-0 bottom-4 flex flex-col items-center gap-1.5">
                <Icon name="plate" size={20} className="text-shell-300" />
                <p className="text-[12px] font-bold text-shell-300">Simulation caméra — capturez une photo d'exemple</p>
              </div>
            </div>

            {/* Galerie d'exemples */}
            <div>
              <p className="mb-2 text-[11px] font-extrabold tracking-wide text-shell-300">OU CHOISIR UNE PHOTO D'EXEMPLE</p>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {SAMPLE_MEALS.map((m, i) => (
                  <button
                    key={m.key}
                    onClick={() => {
                      setPhoto({ uri: m.src, sampleKey: m.key });
                      setShotIndex(i + 1);
                    }}
                    className="group relative h-[64px] w-[64px] shrink-0 overflow-hidden rounded-[16px] border-2 border-shell-600 transition-all hover:border-lime-glow/70 active:scale-95"
                    title={m.label}
                  >
                    <img src={m.src} alt={m.label} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" />
                  </button>
                ))}
              </div>
            </div>

            {/* Déclencheur */}
            <div className="flex items-center justify-center pb-1">
              <button
                onClick={capture}
                aria-label="Prendre une photo"
                className="flex h-[74px] w-[74px] items-center justify-center rounded-full border-4 border-lime-glow transition-transform active:scale-90"
              >
                <span className="h-[56px] w-[56px] rounded-full bg-lime-glow" />
              </button>
            </div>
          </>
        )}
      </div>
    </Screen>
  );
}
