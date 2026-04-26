import { act, renderHook } from "@testing-library/react";
import { useDispatch, useSelector } from "react-redux";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
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
        auth: {
          user: { uid: "uid-123", cluster: 2 },
        },
      }),
    );
  });

  test("startLoadingRecommendation should fallback to profile recommendation", async () => {
    collection.mockReturnValue("recommendations-ref");
    where.mockReturnValue("where-ref");
    query.mockReturnValue("query-ref");
    getDocs.mockResolvedValue({ empty: true });
    getRecommendationForProfile.mockReturnValue({
      text: "Estudia por bloques.",
      action: { title: "Bloque de estudio", duration: 1 },
    });

    const { result } = renderHook(() => useRecommendationStore());

    await act(async () => {
      await result.current.startLoadingRecommendation();
    });

    expect(getRecommendationForProfile).toHaveBeenCalledWith(2);
    expect(dispatch).toHaveBeenCalledWith(
      onLoadRecommendation({
        id: null,
        text: "Estudia por bloques.",
        action: { title: "Bloque de estudio", duration: 1 },
      }),
    );
  });

  test("dismissRecommendation should mark firestore recommendation as viewed", async () => {
    doc.mockReturnValue("recommendation-doc");
    updateDoc.mockResolvedValue({});

    const { result } = renderHook(() => useRecommendationStore());

    await act(async () => {
      await result.current.dismissRecommendation({ id: "rec-1" });
    });

    expect(dispatch).toHaveBeenCalledWith(onDismissRecommendation());
    expect(doc).toHaveBeenCalledWith({}, "users/uid-123/recommendations/rec-1");
    expect(updateDoc).toHaveBeenCalledWith("recommendation-doc", {
      viewed: true,
    });
  });
});
