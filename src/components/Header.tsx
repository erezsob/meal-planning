import { Link } from "@tanstack/react-router";
import { BookOpen, Calendar, Menu, ShoppingCart, X } from "lucide-react";
import { useState } from "react";

const NAV_LINK_BASE =
	"flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors";
const NAV_LINK_ACTIVE =
	"flex items-center gap-3 p-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors";

interface NavItemProps {
	to: string;
	icon: React.ReactNode;
	label: string;
	onNavigate: () => void;
}

/**
 * Navigation link item with icon and label
 */
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
 * App header with mobile-friendly navigation drawer
 */
export function Header() {
	const [isOpen, setIsOpen] = useState(false);

	const closeMenu = () => setIsOpen(false);

	return (
		<>
			<header className="sticky top-0 z-40 p-4 flex items-center justify-between bg-gray-900 text-white shadow-lg">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => setIsOpen(true)}
						className="p-2 hover:bg-gray-800 rounded-lg transition-colors md:hidden"
						aria-label="Open menu"
					>
						<Menu size={24} />
					</button>
					<Link to="/" className="flex items-center gap-2">
						<span className="text-2xl">🍽️</span>
						<span className="text-xl font-semibold hidden sm:inline">
							Meal Planner
						</span>
					</Link>
				</div>

				{/* Desktop navigation */}
				<nav className="hidden md:flex items-center gap-1" aria-label="Main">
					<Link
						to="/"
						className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors",
						}}
					>
						<Calendar size={18} />
						<span>Calendar</span>
					</Link>
					<Link
						to="/library"
						className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors",
						}}
					>
						<BookOpen size={18} />
						<span>Library</span>
					</Link>
					<Link
						to="/shopping"
						className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
						activeProps={{
							className:
								"flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors",
						}}
					>
						<ShoppingCart size={18} />
						<span>Shopping</span>
					</Link>
				</nav>
			</header>

			{/* Mobile drawer backdrop */}
			{isOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-40 md:hidden"
					onClick={closeMenu}
					onKeyDown={(e) => e.key === "Escape" && closeMenu()}
					aria-hidden="true"
				/>
			)}

			{/* Mobile drawer */}
			<aside
				className={`fixed top-0 left-0 h-full w-72 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col md:hidden ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
				aria-label="Mobile navigation"
			>
				<div className="flex items-center justify-between p-4 border-b border-gray-700">
					<div className="flex items-center gap-2">
						<span className="text-2xl">🍽️</span>
						<span className="text-lg font-semibold">Meal Planner</span>
					</div>
					<button
						type="button"
						onClick={closeMenu}
						className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 p-4 space-y-2" aria-label="Mobile">
					<NavItem
						to="/"
						icon={<Calendar size={20} />}
						label="Calendar"
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
				</nav>
			</aside>
		</>
	);
}
