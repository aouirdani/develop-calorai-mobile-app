/**
 * Analyse — écran d'attente pendant l'appel POST /api/v1/estimates ou
 * /estimates/barcode. Messages génériques (le backend répond en une requête,
 * on ne prétend pas suivre ses étapes internes).
 */
import { useEffect, useRef, useState } from "react";
import { NetworkError, type EstimatePhotoInput } from "../../../mobile/services/api";
import { setEstimateMeta } from "../../../mobile/utils/estimateMeta";
import { Icon } from "../Icon";
import { getApi } from "../env";
import { useNav, useRoute } from "../shell";
import { Screen } from "../ui";
import { cn } from "../../utils/cn";

const STAGES = ["Analyse de votre repas…", "Identification des aliments…", "Estimation des portions…", "Calcul des macros…"];

export function AnalysisScreen() {
  const nav = useNav();
  const route = useRoute();
  const input = route.name === "analysis" ? route.input : null;
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<{ title: string; body: string; offline: boolean } | null>(null);
  const ranRef = useRef(false);

  const run = async () => {
    if (!input) return;
    setError(null);
    setStage(0);
    const started = Date.now();
    try {
      let estimateId: string;
      let imageForMeta: string | null = null;
      if (input.mode === "barcode") {
        const est = await getApi().createBarcodeEstimate(input.code);
        estimateId = est.id;
      } else {
        const blob = await (await fetch(input.uri)).blob();
        // Nom de fichier "sample:xxx" → le mock choisit le preset assorti à la photo.
        const file = new File([blob], input.sampleKey ?? "photo.jpg", { type: blob.type || "image/jpeg" });
        const payload: EstimatePhotoInput = {
          image: file,
          ...(input.diametre != null ? { diametre_assiette_cm: input.diametre } : {}),
          ...(input.contexte ? { contexte: input.contexte } : {}),
        };
        const est = await getApi().createEstimate(payload);
        estimateId = est.id;
        imageForMeta = input.sampleKey ?? input.uri;
      }
      const elapsed = Date.now() - started;
      if (elapsed < 2600) await new Promise((r) => setTimeout(r, 2600 - elapsed));
      setEstimateMeta(estimateId, { image: imageForMeta });
      nav.replace({ name: "result", estimateId });
    } catch (e) {
      if (e instanceof NetworkError) setError({ title: "Hors ligne", body: e.message, offline: true });
      else setError({ title: "L'analyse a échoué", body: e instanceof Error ? e.message : "Réessayez dans un instant.", offline: false });
    }
  };

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (error) return;
    const t = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 850);
    return () => clearInterval(t);
  }, [error]);

  const photo = input && input.mode === "photo" ? input.uri : null;

  return (
    <Screen dark className="items-center justify-center">
      {error ? (
        <div className="anim-pop flex w-full max-w-[300px] flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-[22px] border border-shell-600 bg-shell-800">
            <Icon name={error.offline ? "wifiOff" : "alert"} size={26} className={error.offline ? "text-carbs" : "text-danger"} />
          </div>
          <p className="mt-4 font-display text-[19px] font-extrabold">{error.title}</p>
          <p className="mt-1.5 text-[13.5px] leading-5 text-shell-300">{error.body}</p>
          <button
            onClick={() => void run()}
            className="mt-5 flex items-center gap-2 rounded-[16px] bg-lime-glow px-6 py-3.5 text-[15px] font-extrabold text-lime-ink transition-all hover:bg-lime-soft active:scale-95"
          >
            <Icon name="refresh" size={16} /> Réessayer
          </button>
          <button onClick={() => nav.pop()} className="mt-3 text-[13.5px] font-bold text-shell-300 transition-colors hover:text-white">
            Retour
          </button>
        </div>
      ) : (
        <>
          {/* Photo + balayage */}
          <div className="relative h-[300px] w-[240px] overflow-hidden rounded-[28px] border border-shell-600 bg-shell-800">
            {photo ? <img src={photo} alt="" className="h-full w-full object-cover opacity-55" /> : null}
            <div className="pointer-events-none absolute inset-3 rounded-[22px] border-[1.5px] border-lime-glow/50" />
            <div className="anim-scanline pointer-events-none absolute left-5 right-5 h-[3px] rounded-full bg-lime-glow shadow-[0_0_16px_3px_rgba(200,241,105,0.5)]" />
          </div>

          {/* Étapes génériques */}
          <div className="mt-7 w-full max-w-[290px] space-y-3">
            {STAGES.map((label, i) => (
              <div key={label} className={cn("flex items-center gap-2.5 transition-opacity duration-300", i <= stage ? "opacity-100" : "opacity-35")}>
                {i < stage ? (
                  <Icon name="check" size={16} strokeWidth={3} className="shrink-0 text-lime-glow" />
                ) : i === stage ? (
                  <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-lime-glow/30 border-t-lime-glow" />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full border-2 border-shell-500" />
                )}
                <span className={cn("text-[14px]", i === stage ? "font-extrabold text-white" : "font-semibold text-shell-200")}>{label}</span>
              </div>
            ))}
          </div>
          <p className="tnum absolute bottom-6 font-mono text-[10.5px] font-medium text-shell-400">
            {input?.mode === "barcode" ? "POST /api/v1/estimates/barcode" : "POST /api/v1/estimates · multipart image"}
          </p>
        </>
      )}
    </Screen>
  );
}
