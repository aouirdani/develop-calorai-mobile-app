/**
 * Code-barres — visée simulée, scan caméra réel si BarcodeDetector existe,
 * saisie manuelle (EAN 8–14 chiffres, contrat API) et codes d'exemple.
 * La requête POST /api/v1/estimates/barcode est jouée par l'écran Analyse.
 */
import { useEffect, useRef, useState } from "react";
import { SAMPLE_BARCODES } from "../../../mobile/services/api";
import { Icon } from "../Icon";
import { useNav } from "../shell";
import { Screen } from "../ui";
import { cn } from "../../utils/cn";

type Detector = { detect(src: CanvasImageSource): Promise<{ rawValue: string }[]> };
const DetectorCtor = (window as unknown as { BarcodeDetector?: new (opts?: { formats: string[] }) => Detector }).BarcodeDetector;

export function BarcodeScreen() {
  const nav = useNav();
  const [manual, setManual] = useState("");
  const [manualError, setManualError] = useState<string | null>(null);
  const [camOn, setCamOn] = useState(false);
  const [camError, setCamError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef(0);

  const stopCam = () => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCamOn(false);
  };

  useEffect(() => stopCam, []);

  const submit = (raw: string) => {
    const code = raw.replace(/\D/g, "");
    if (code.length < 8 || code.length > 14) {
      setManualError("Le code doit contenir entre 8 et 14 chiffres.");
      return;
    }
    setManualError(null);
    nav.push({ name: "analysis", input: { mode: "barcode", code } });
  };

  const startCam = async () => {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      setCamOn(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
      if (DetectorCtor) {
        const detector = new DetectorCtor({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"] });
        const tick = async () => {
          if (!streamRef.current || !videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }
          try {
            const codes = await detector.detect(videoRef.current);
            const value = codes[0]?.rawValue;
            if (value) {
              stopCam();
              submit(value);
              return;
            }
          } catch {
            /* frame pas encore décodable */
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      }
    } catch {
      setCamError("Caméra indisponible ici — utilisez la simulation ou la saisie manuelle.");
    }
  };

  const simulateScan = () => {
    const pick = SAMPLE_BARCODES[Math.floor(Math.random() * SAMPLE_BARCODES.length)];
    submit(pick.code);
  };

  return (
    <Screen dark padded={false} className="flex flex-col">
      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto px-5 pb-5 pt-4 no-scrollbar">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              stopCam();
              nav.pop();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-shell-600 bg-shell-800 transition-transform active:scale-90"
            aria-label="Retour"
          >
            <Icon name="chevron-left" size={18} strokeWidth={2.5} />
          </button>
          <h1 className="font-display text-[16.5px] font-extrabold tracking-tight">Code-barres</h1>
          <span className="w-10" />
        </div>

        {/* Viseur */}
        <div className="relative h-[228px] shrink-0 overflow-hidden rounded-[26px] border border-shell-600 bg-[radial-gradient(circle_at_50%_40%,#213527,#0f1a13_75%)]">
          {camOn ? (
            <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          ) : null}
          {/* coins */}
          {[
            "left-4 top-4 rounded-tl-[12px] border-l-[3px] border-t-[3px]",
            "right-4 top-4 rounded-tr-[12px] border-r-[3px] border-t-[3px]",
            "bottom-4 left-4 rounded-bl-[12px] border-b-[3px] border-l-[3px]",
            "bottom-4 right-4 rounded-br-[12px] border-b-[3px] border-r-[3px]",
          ].map((c) => (
            <span key={c} className={cn("pointer-events-none absolute h-9 w-9 border-lime-glow/60", c)} />
          ))}
          {/* laser */}
          <div className="anim-laser pointer-events-none absolute top-1/2 h-[2.5px] w-1/4 -translate-y-1/2 rounded-full bg-lime-glow shadow-[0_0_16px_3px_rgba(200,241,105,0.5)]" />
          {!camOn ? (
            <div className="absolute inset-x-0 bottom-3.5 flex flex-col items-center gap-1">
              <Icon name="barcode" size={19} className="text-shell-300" />
              <p className="text-[11.5px] font-bold text-shell-300">EAN 8, 13 · UPC · Code 128</p>
            </div>
          ) : !DetectorCtor ? (
            <p className="absolute inset-x-4 bottom-3.5 text-center text-[11px] font-bold text-lime-glow/90">
              Caméra active — la détection automatique n'est pas supportée par ce navigateur
            </p>
          ) : null}
        </div>

        {/* Actions caméra */}
        <div className="grid grid-cols-2 gap-2.5">
          {camOn ? (
            <button onClick={stopCam} className="flex items-center justify-center gap-2 rounded-[16px] border border-shell-600 bg-shell-800 py-3 text-[13.5px] font-bold text-shell-200 transition-all hover:bg-shell-700 active:scale-[0.97]">
              <Icon name="x" size={15} /> Arrêter la caméra
            </button>
          ) : (
            <button onClick={() => void startCam()} className="flex items-center justify-center gap-2 rounded-[16px] border border-shell-600 bg-shell-800 py-3 text-[13.5px] font-bold text-shell-200 transition-all hover:bg-shell-700 active:scale-[0.97]">
              <Icon name="camera" size={15} className="text-lime-glow" /> Caméra réelle
            </button>
          )}
          <button onClick={simulateScan} className="flex items-center justify-center gap-2 rounded-[16px] bg-lime-glow py-3 text-[13.5px] font-extrabold text-lime-ink transition-all hover:bg-lime-soft active:scale-[0.97]">
            <Icon name="bolt" size={15} /> Simuler un scan
          </button>
        </div>
        {camError ? <p className="text-[12px] font-bold text-carbs">{camError}</p> : null}

        {/* Saisie manuelle */}
        <div>
          <p className="mb-2 text-[11px] font-extrabold tracking-wide text-shell-300">SAISIE MANUELLE · EAN 8–14 CHIFFRES</p>
          <div className="flex gap-2">
            <input
              value={manual}
              onChange={(e) => {
                setManual(e.target.value.replace(/\D/g, "").slice(0, 14));
                setManualError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit(manual);
              }}
              inputMode="numeric"
              placeholder="3017620422003"
              className={cn(
                "tnum min-w-0 flex-1 rounded-[16px] border bg-shell-800 px-4 py-3.5 font-mono text-[15px] font-medium tracking-[0.08em] text-[#F2F6EC] outline-none placeholder:text-shell-400",
                manualError ? "border-danger" : "border-shell-600 focus:border-lime-glow/60"
              )}
            />
            <button
              onClick={() => submit(manual)}
              className="flex w-[52px] shrink-0 items-center justify-center rounded-[16px] bg-lime-glow text-lime-ink transition-all hover:bg-lime-soft active:scale-95"
              aria-label="Valider le code"
            >
              <Icon name="arrow-right" size={19} strokeWidth={2.4} />
            </button>
          </div>
          {manualError ? <p className="mt-1.5 text-[12px] font-bold text-danger">{manualError}</p> : null}
        </div>

        {/* Codes d'exemple */}
        <div>
          <p className="mb-2 text-[11px] font-extrabold tracking-wide text-shell-300">CODES D'EXEMPLE</p>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_BARCODES.map((s) => (
              <button
                key={s.code}
                onClick={() => submit(s.code)}
                className="flex items-center gap-1.5 rounded-full border border-shell-600 bg-shell-800 px-3 py-2 text-[12px] font-bold text-shell-200 transition-all hover:border-lime-glow/50 active:scale-95"
              >
                <Icon name="barcode" size={13} className="text-lime-glow" /> {s.label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-[11px] leading-4 text-shell-400">
            Un code inconnu renvoie l'erreur <span className="font-mono text-shell-300">404 produit_introuvable</span> — l'état « Produit introuvable » s'affiche sur l'écran d'analyse.
          </p>
        </div>
      </div>
    </Screen>
  );
}
