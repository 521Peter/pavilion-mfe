import type { ReactNode } from "react";
import { Modal } from "@heroui/react";

type AiCenterModalSize = "xs" | "sm" | "md" | "lg" | "cover" | "full";

interface AiCenterModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: AiCenterModalSize;
}

export default function AiCenterModal({
  isOpen,
  onOpenChange,
  title,
  children,
  footer,
  size = "md"
}: AiCenterModalProps) {
  return (
    <Modal>
      <Modal.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
        <Modal.Container placement="auto" size={size}>
          <Modal.Dialog>
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>{title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>{children}</Modal.Body>
            {footer ? <Modal.Footer>{footer}</Modal.Footer> : null}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
