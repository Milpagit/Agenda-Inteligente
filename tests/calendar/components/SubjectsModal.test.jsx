import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import Swal from "sweetalert2";
import { getAuth } from "firebase/auth";
import importApi from "../../../src/api/importApi";
import { SubjectsModal } from "../../../src/calendar/components/SubjectsModal";
import {
  useCalendarStore,
  useForm,
  useSubjectStore,
  useUiStore,
} from "../../../src/hooks";

jest.mock("../../../src/hooks", () => ({
  useUiStore: jest.fn(),
  useSubjectStore: jest.fn(),
  useCalendarStore: jest.fn(),
  useForm: jest.fn(),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(),
}));

jest.mock("../../../src/api/importApi", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock("sweetalert2", () => ({
  fire: jest.fn(),
  showLoading: jest.fn(),
}));

jest.mock("react-modal", () => {
  const React = require("react");
  const Modal = ({ isOpen, children }) =>
    isOpen ? <div>{children}</div> : null;
  Modal.setAppElement = jest.fn();
  return Modal;
});

jest.mock("react-datepicker", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ selected }) => (
      <input
        readOnly
        aria-label="date-picker"
        value={selected ? selected.toISOString() : ""}
      />
    ),
    registerLocale: jest.fn(),
  };
});

describe("Tests on <SubjectsModal /> import flow", () => {
  const mockStartLoadingEvents = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    useUiStore.mockReturnValue({
      isSubjectsModalOpen: true,
      closeSubjectsModal: jest.fn(),
    });
    useSubjectStore.mockReturnValue({
      subjects: [],
      startSavingSubject: jest.fn(),
      startDeletingSubject: jest.fn(),
    });
    useCalendarStore.mockReturnValue({
      startLoadingEvents: mockStartLoadingEvents,
    });
    useForm.mockReturnValue({
      name: "",
      color: "#46487A",
      onInputChange: jest.fn(),
      onResetForm: jest.fn(),
    });

    getAuth.mockReturnValue({
      currentUser: {
        getIdToken: jest.fn().mockResolvedValue("token-123"),
      },
    });
    importApi.post.mockResolvedValue({ data: { ok: true } });

    global.FileReader = jest.fn(() => ({
      readAsDataURL() {
        this.result = "data:application/pdf;base64,ZmFrZQ==";
        this.onload();
      },
    }));
  });

  test("should call importApi and refresh events after successful import", async () => {
    render(<SubjectsModal />);

    const fileInput = screen.getByLabelText("Selecciona Imagen o PDF:");
    const file = new File(["dummy"], "horario.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: /Importar Horario/i }),
      );
    });

    await waitFor(() =>
      expect(importApi.post).toHaveBeenCalledWith(
        "",
        expect.objectContaining({
          fileData: "ZmFrZQ==",
          fileType: "application/pdf",
        }),
        {
          headers: {
            Authorization: "Bearer token-123",
          },
        },
      ),
    );

    expect(mockStartLoadingEvents).toHaveBeenCalled();
    expect(Swal.fire).toHaveBeenCalledWith(
      "¡Éxito!",
      "Horario importado.",
      "success",
    );
  });
});
