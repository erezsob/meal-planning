import {
	createContext,
	useCallback,
	useContext,
	useMemo,
	useState,
} from "react";

interface Toast {
	id: number;
	message: string;
}

interface ToastContextValue {
	showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TOAST_DURATION_MS = 3000;

/**
 * Global toast provider for brief confirmation messages.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const showToast = useCallback((message: string) => {
		const id = Date.now();
		setToasts((prev) => [...prev, { id, message }]);
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id));
		}, TOAST_DURATION_MS);
	}, []);

	const value = useMemo(() => ({ showToast }), [showToast]);

	return (
		<ToastContext.Provider value={value}>
			{children}
			<div
				className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 md:bottom-6"
				aria-live="polite"
			>
				{toasts.map((toast) => (
					<div
						key={toast.id}
						className="rounded-lg border bg-card px-4 py-2 text-sm shadow-lg"
					>
						{toast.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	);
}

/**
 * Show a brief confirmation or error message via the global toast.
 */
export function useToast(): ToastContextValue {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within ToastProvider");
	}
	return context;
}
