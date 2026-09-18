/**
 * Aliments — GET /api/v1/foods?q=... avec pagination (limit/offset),
 * puis ajout manuel au journal via une fiche portion.
 * États : chargement (squelettes), vide, erreur + retry, chargement de page.
 */
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { getApi } from "../../services/api/env";
import { appStore } from "../_layout";
import { Chip, EmptyState, ErrorState, Screen } from "../../components/ui";
import { MACRO_KEYS, MACRO_META, SLOT_META, SLOT_ORDER } from "../../constants/nutrition";
import { colors, radius } from "../../constants/theme";
import { NetworkError } from "../../services/api";
import type { Food } from "../../types/api";
import type { MealLog, MealSlot } from "../../types/app";
import { fmtEst, fmtNum, fmtRangeSub, scaleRange, slotForHour, todayKey, uid } from "../../utils/format";

const PAGE = 12;

function FoodSkeleton() {
  return (
    <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 14, marginBottom: 10 }}>
      <View style={{ width: "55%", height: 12, borderRadius: 6, backgroundColor: colors.surfaceAlt, marginBottom: 8 }} />
      <View style={{ width: "35%", height: 10, borderRadius: 5, backgroundColor: colors.surfaceAlt }} />
    </View>
  );
}

export default function AlimentsScreen() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [items, setItems] = useState<Food[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selected, setSelected] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const [slot, setSlot] = useState<MealSlot>(slotForHour(new Date().getHours()));
  const [added, setAdded] = useState(false);
  const reqSeq = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const fetchPage = useCallback(async (q: string, offset: number) => {
    const id = ++reqSeq.current;
    if (offset === 0) {
      setLoading(true);
      setItems([]);
    } else {
      setLoadingMore(true);
    }
    setError(null);
    try {
      const page = await getApi().searchFoods({ q, limit: PAGE, offset });
      if (id !== reqSeq.current) return;
      setItems((prev) => (offset === 0 ? page.aliments : [...prev, ...page.aliments]));
      setTotal(page.total);
    } catch (e) {
      if (id !== reqSeq.current) return;
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (id === reqSeq.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchPage(debounced, 0);
  }, [debounced, fetchPage]);

  const openFood = (f: Food) => {
    setSelected(f);
    setGrams(100);
    setSlot(slotForHour(new Date().getHours()));
    setAdded(false);
  };

  const scaled = useMemo(() => {
    if (!selected) return null;
    const f = grams / 100;
    return {
      calories: scaleRange(selected.calories, f),
      proteines: scaleRange(selected.macros.proteines, f),
      glucides: scaleRange(selected.macros.glucides, f),
      lipides: scaleRange(selected.macros.lipides, f),
    };
  }, [selected, grams]);

  const confirmAdd = () => {
    if (!selected || !scaled) return;
    const meal: MealLog = {
      id: uid("meal"),
      day: todayKey(),
      slot,
      label: selected.nom,
      source: "manuel",
      estimate_id: null,
      image: null,
      total: scaled,
      aliments: [
        {
          nom: selected.nom,
          source_nutritionnelle: "Base aliments",
          quantite: { estimation: grams, min: grams, max: grams, unite: "g" },
          calories: scaled.calories,
          macros: { proteines: scaled.proteines, glucides: scaled.glucides, lipides: scaled.lipides },
          confiance: 1,
          methode: "manuel",
        },
      ],
      added_at: new Date().toISOString(),
    };
    appStore.addMeal(meal);
    setAdded(true);
    setTimeout(() => setSelected(null), 700);
  };

  return (
    <Screen noPadding>
      <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <Text style={{ color: colors.ink, fontSize: 24, fontWeight: "800", marginBottom: 12 }}>Aliments</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, paddingHorizontal: 14, marginBottom: 14 }}>
          <Ionicons name="search" size={18} color={colors.faint} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Rechercher un aliment…"
            placeholderTextColor={colors.faint}
            autoCorrect={false}
            style={{ flex: 1, paddingVertical: 13, color: colors.ink, fontSize: 15.5 }}
          />
          {query ? (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.faint} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={{ paddingHorizontal: 20 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <FoodSkeleton key={i} />
          ))}
        </View>
      ) : error ? (
        <ErrorState
          title={error instanceof NetworkError ? "Hors ligne" : "Recherche impossible"}
          body={error.message}
          offline={error instanceof NetworkError}
          onRetry={() => fetchPage(debounced, 0)}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(f) => f.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          ListHeaderComponent={
            <Text style={{ color: colors.faint, fontSize: 12, fontWeight: "700", marginBottom: 10 }}>
              {query ? `${total} résultat${total > 1 ? "s" : ""} pour « ${query} »` : "Aliments courants (100 g)"}
            </Text>
          }
          ListEmptyComponent={
            <EmptyState
              icon="search-outline"
              title={`Rien pour « ${query} »`}
              text="Essayez un autre terme, ou scannez le code-barres du produit directement."
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (!loadingMore && items.length < total) void fetchPage(debounced, items.length);
          }}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const kcalSub = fmtRangeSub(item.calories, "kcal");
            return (
              <Pressable
                onPress={() => openFood(item)}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.line,
                    borderRadius: radius.lg,
                    padding: 14,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 3 }}>
                  <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "800" }}>{item.nom}</Text>
                  <Text style={{ color: colors.faint, fontSize: 12 }}>
                    {item.marque ? `${item.marque} · ` : ""}pour {item.quantite_reference}
                  </Text>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 4 }}>
                    {MACRO_KEYS.map((k) => (
                      <Chip key={k} color={MACRO_META[k].color} bg={MACRO_META[k].soft}>
                        {MACRO_META[k].short} {fmtNum(item.macros[k].estimation)}
                      </Chip>
                    ))}
                  </View>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  <Text style={{ color: colors.ink, fontSize: 15.5, fontWeight: "800", fontVariant: ["tabular-nums"] }}>
                    {fmtEst(item.calories)} <Text style={{ fontSize: 10.5, color: colors.muted }}>kcal</Text>
                  </Text>
                  {kcalSub ? (
                    <View style={{ backgroundColor: colors.surfaceAlt, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2 }}>
                      <Text style={{ color: colors.muted, fontSize: 10, fontWeight: "700" }}>{kcalSub}</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}

      {/* Fiche d'ajout manuel */}
      <Modal visible={selected != null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <Pressable onPress={() => setSelected(null)} style={{ flex: 1, backgroundColor: "rgba(13,23,18,0.45)", justifyContent: "flex-end" }}>
          <Pressable onPress={() => undefined} style={{ backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: 22, paddingBottom: 34, gap: 14 }}>
            {selected ? (
              <>
                <View style={{ width: 44, height: 5, borderRadius: radius.pill, backgroundColor: colors.lineStrong, alignSelf: "center" }} />
                <Text style={{ color: colors.ink, fontSize: 19, fontWeight: "800" }}>{selected.nom}</Text>
                <Text style={{ color: colors.muted, fontSize: 13, marginTop: -10 }}>
                  Valeurs pour {selected.quantite_reference} : {fmtEst(selected.calories)} kcal
                  {fmtRangeSub(selected.calories) ? ` (${fmtRangeSub(selected.calories)})` : ""}
                </Text>
                <View style={{ alignItems: "center", paddingVertical: 4 }}>
                  <Text style={{ color: colors.muted, fontSize: 12.5, fontWeight: "700", marginBottom: 8 }}>Quantité consommée</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    {[50, 100, 150, 200].map((g) => (
                      <Pressable
                        key={g}
                        onPress={() => setGrams(g)}
                        style={{
                          borderRadius: radius.pill,
                          paddingHorizontal: 13,
                          paddingVertical: 8,
                          backgroundColor: grams === g ? colors.primary : colors.surface,
                          borderWidth: 1,
                          borderColor: grams === g ? colors.primary : colors.line,
                        }}
                      >
                        <Text style={{ color: grams === g ? "#F4F8EE" : colors.inkSoft, fontWeight: "700", fontSize: 13.5 }}>{g} g</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                {scaled ? (
                  <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Text style={{ color: colors.ink, fontSize: 20, fontWeight: "800", fontVariant: ["tabular-nums"] }}>
                        {fmtEst(scaled.calories)} <Text style={{ fontSize: 12, color: colors.muted }}>kcal</Text>
                      </Text>
                      {fmtRangeSub(scaled.calories, "kcal") ? (
                        <Text style={{ color: colors.faint, fontSize: 11.5, marginTop: 2 }}>{fmtRangeSub(scaled.calories, "kcal")}</Text>
                      ) : null}
                    </View>
                    <View style={{ gap: 2, alignItems: "flex-end" }}>
                      {MACRO_KEYS.map((k) => (
                        <Text key={k} style={{ color: MACRO_META[k].color, fontSize: 12, fontWeight: "800", fontVariant: ["tabular-nums"] }}>
                          {MACRO_META[k].short} {fmtNum(scaled[k].estimation)} g
                        </Text>
                      ))}
                    </View>
                  </View>
                ) : null}
                <View style={{ flexDirection: "row", gap: 8 }}>
                  {SLOT_ORDER.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setSlot(s)}
                      style={{
                        flex: 1,
                        borderRadius: radius.md,
                        paddingVertical: 9,
                        alignItems: "center",
                        backgroundColor: slot === s ? colors.primarySoft : colors.surface,
                        borderWidth: 1,
                        borderColor: slot === s ? colors.primary : colors.line,
                      }}
                    >
                      <Text style={{ color: slot === s ? colors.primaryInk : colors.muted, fontSize: 11, fontWeight: "700" }}>
                        {SLOT_META[s].label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable
                  onPress={confirmAdd}
                  style={({ pressed }) => [{ backgroundColor: added ? colors.primary : colors.dark, borderRadius: radius.lg, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, opacity: pressed ? 0.9 : 1 }]}
                >
                  <Ionicons name={added ? "checkmark" : "add"} size={18} color={colors.accent} />
                  <Text style={{ color: added ? "#F4F8EE" : "#F2F6EC", fontSize: 16, fontWeight: "800" }}>
                    {added ? "Ajouté au journal" : "Ajouter au journal"}
                  </Text>
                </Pressable>
              </>
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
