import { act, renderHook } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  setDoc,
  increment,
} from "firebase/firestore/lite";
import { getRecommendationForProfile } from "../../src/core/recommendationEngine";
import { useRecommendationStore } from "../../src/hooks/useRecommendationStore";
import {
  onDismissRecommendation,
  onLoadRecommendation,
} from "../../src/store/recommendations/recommendationSlice";

jest.mock("react-redux", () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock("../../src/firebase/config", () => ({
  FirebaseDB: {},
}));

jest.mock("firebase/firestore/lite", () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
  setDoc: jest.fn(),
  increment: jest.fn((value) => value),
}));

jest.mock("../../src/core/recommendationEngine", () => ({
  getRecommendationForProfile: jest.fn(),
}));

describe("Tests on useRecommendationStore hook", () => {
  const dispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useDispatch.mockReturnValue(dispatch);
    useSelector.mockImplementation((selector) =>
      selector({
        recommendations: {
          activeRecommendation: null,
        },
        tasks: {
          tasks: [],
        },
        habits: {
          habits: [],
        },
        calendar: {
          events: [],
        },
        auth: {
          user: { uid: "uid-123", cluster: 2, riskScore: 0.4 },
        },
      }),
    );
  });

  test("startLoadingRecommendation should fallback to profile recommendation", async () => {
    collection.mockReturnValue("recommendations-ref");
    where.mockReturnValue("where-ref");
    query.mockReturnValue("query-ref");
    getDocs
      .mockResolvedValueOnce({ empty: true })
      .mockResolvedValueOnce({ forEach: jest.fn() });
    getRecommendationForProfile.mockReturnValue({
      id: "rec-1",
      text: "Estudia por bloques.",
      action: { title: "Bloque de estudio", duration: 1 },
    });

    const { result } = renderHook(() => useRecommendationStore());

    await act(async () => {
      await result.current.startLoadingRecommendation();
    });

    expect(getRecommendationForProfile).toHaveBeenCalledWith(
      2,
      expect.any(Object),
      {},
    );
    expect(dispatch).toHaveBeenCalledWith(
      onLoadRecommendation({
        id: "rec-1",
        text: "Estudia por bloques.",
        action: { title: "Bloque de estudio", duration: 1 },
        source: "local",
      }),
    );
    expect(setDoc).toHaveBeenCalled();
  });

  test("dismissRecommendation should mark firestore recommendation as viewed", async () => {
    doc.mockReturnValueOnce("history-doc").mockReturnValueOnce(
      "recommendation-doc",
    );
    updateDoc.mockResolvedValue({});

    const { result } = renderHook(() => useRecommendationStore());

    await act(async () => {
      await result.current.dismissRecommendation({
        id: "rec-1",
        text: "Texto",
        source: "firebase",
      });
    });

    expect(dispatch).toHaveBeenCalledWith(onDismissRecommendation());
    expect(doc).toHaveBeenCalledWith(
      {},
      "users/uid-123/recommendationHistory/rec-1",
    );
    expect(doc).toHaveBeenCalledWith({}, "users/uid-123/recommendations/rec-1");
    expect(updateDoc).toHaveBeenCalledWith("recommendation-doc", {
      viewed: true,
    });
    expect(setDoc).toHaveBeenCalledWith(
      "history-doc",
      expect.any(Object),
      expect.any(Object),
    );
  });
});
