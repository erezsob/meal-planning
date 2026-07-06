import { Link } from "@tanstack/react-router";
import {
	BookOpen,
	Calendar,
	ClipboardList,
	History,
	Menu,
	Plus,
	ShoppingCart,
} from "lucide-react";
import { useState } from "react";
import { LogMealModal } from "@/components/log";
import { Button } from "@/lib/components/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@/lib/components/sheet";

const NAV_LINK_BASE =
	"flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors";
const NAV_LINK_ACTIVE =
	"flex items-center gap-3 p-3 rounded-lg bg-primary hover:bg-primary/90 transition-colors";

interface NavItemProps {
	to: string;
	icon: React.ReactNode;
	label: string;
	onNavigate: () => void;
}

function NavItem({ to, icon, label, onNavigate }: NavItemProps) {
	return (
		<Link
			to={to}
			onClick={onNavigate}
			className={NAV_LINK_BASE}
			activeProps={{ className: NAV_LINK_ACTIVE }}
		>
			{icon}
			<span className="font-medium">{label}</span>
		</Link>
	);
}

/**
 * App header with mobile-friendly navigation drawer and global log action.
 */
export function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const [isLogOpen, setIsLogOpen] = useState(false);

	const closeMenu = () => setIsOpen(false);

	return (
		<>
			<header className="sticky top-0 z-40 p-4 flex items-center justify-between bg-card text-foreground shadow-lg border-b">
				<div className="flex items-center gap-3">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => setIsOpen(true)}
						className="md:hidden"
						aria-label="Open menu"
					>
						<Menu size={24} />
					</Button>
					<Link to="/" className="flex items-center gap-2">
						<span className="text-2xl">🍽️</span>
						<span className="text-xl font-semibold hidden sm:inline">
							Meal Planner
						</span>
					</Link>
				</div>

				<nav className="hidden md:flex items-center gap-1" aria-label="Main">
					<Link
						to="/"
						className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent transition-colors"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors",
						}}
					>
						<Calendar size={18} />
						<span>Calendar</span>
					</Link>
					<Link
						to="/history"
						className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent transition-colors"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors",
						}}
					>
						<History size={18} />
						<span>History</span>
					</Link>
					<Link
						to="/library"
						className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent transition-colors"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors",
						}}
					>
						<BookOpen size={18} />
						<span>Library</span>
					</Link>
					<Link
						to="/shopping"
						className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-accent transition-colors"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 transition-colors",
						}}
					>
						<ShoppingCart size={18} />
						<span>Shopping</span>
					</Link>
					<Button onClick={() => setIsLogOpen(true)} className="ml-2 gap-2">
						<ClipboardList size={18} />
						<span>Log meal</span>
					</Button>
				</nav>
			</header>

			<Button
				onClick={() => setIsLogOpen(true)}
				className="fixed bottom-6 right-4 z-40 h-14 w-14 rounded-full shadow-lg md:hidden"
				size="icon"
				aria-label="Log meal"
			>
				<Plus size={24} />
			</Button>

			<Sheet open={isOpen} onOpenChange={setIsOpen}>
				<SheetContent side="left" className="w-72 p-0 md:hidden">
					<SheetHeader className="border-b p-4">
						<SheetTitle className="flex items-center gap-2">
							<span className="text-2xl">🍽️</span>
							<span>Meal Planner</span>
						</SheetTitle>
					</SheetHeader>

					<nav className="flex-1 p-4 space-y-2" aria-label="Mobile">
						<NavItem
							to="/"
							icon={<Calendar size={20} />}
							label="Calendar"
							onNavigate={closeMenu}
						/>
						<NavItem
							to="/history"
							icon={<History size={20} />}
							label="History"
							onNavigate={closeMenu}
						/>
						<NavItem
							to="/library"
							icon={<BookOpen size={20} />}
							label="Recipe Library"
							onNavigate={closeMenu}
						/>
						<NavItem
							to="/shopping"
							icon={<ShoppingCart size={20} />}
							label="Shopping List"
							onNavigate={closeMenu}
						/>
						<Button
							onClick={() => {
								setIsLogOpen(true);
								closeMenu();
							}}
							className="w-full gap-2"
						>
							<ClipboardList size={18} />
							Log meal
						</Button>
					</nav>
				</SheetContent>
			</Sheet>

			{isLogOpen && <LogMealModal onClose={() => setIsLogOpen(false)} />}
		</>
	);
}
