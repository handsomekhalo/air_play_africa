'use client';

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "AuthContext";
const Sidebar = () => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuth();

  const navItems = [
    {
      title: "Overview",
      links: [
        { href: "/admin/dashboard", icon: "bx bx-home", label: "Dashboard" },
      ],
    },
    {
      title: "Users",
      links: [
        { href: "/admin/users/artists", icon: "bx bx-music",  label: "Artists" },
        { href: "/admin/users/admins",  icon: "bx bx-shield", label: "Admins"  },
      ],
    },
    {
      title: "Content",
      links: [
        { href: "/admin/tracks", icon: "bx bx-film", label: "Track Moderation" },
      ],
    },
    {
      title: "Account",
      links: [
        { href: "/profile", icon: "bx bx-user-circle", label: "Profile" },
      ],
    },
  ];

  return (
    <>
      <button
        className="md:hidden p-4 text-gray-600 z-50 relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <i className="bx bx-menu text-3xl"></i>
      </button>

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-border shadow-sm z-40 transform transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:relative md:block`}
      >
        <div className="p-6 space-y-8">
          {navItems.map((section, index) => (
            <div key={index}>
              <span className="text-xs uppercase tracking-wide text-muted-foreground block mb-3">
                {section.title}
              </span>
              <ul className="space-y-2">
                {section.links.map((link, idx) => {
                  const isActive = pathname === link.href;
                  return (
                    <li key={idx}>
                      <Link
                        href={link.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition
                          ${isActive ? "bg-muted font-semibold" : "hover:bg-muted/50"}`}
                      >
                        <i className={`${link.icon} text-lg`} aria-hidden="true" />
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Logout — button not link */}
          <div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground block mb-3">
              Session
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm transition hover:bg-muted/50 w-full text-left text-red-500 hover:text-red-600"
            >
              <i className="bx bx-log-out text-lg" aria-hidden="true" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;


// 'use client';
// import { useEffect } from 'react';
// import { useAuth } from '../../../AuthContext';
// import { useRouter } from 'next/navigation';
// // import backendApi from '../../../utils/backendApi';
// import backendApi from '../../utils/backendApi';
// import Sidebar from '../Components/System_Management_Components/dashboard/SideBarComponent/sidebar';
// import Navbar from '../Components/System_Management_Components/dashboard/SideBarComponent/navheader';
// // import Sidebar from '../Components/System_Management_Component/dashboard/SideBarComponent/sidebar';
// // import Navbar from '../System_Management_Component/dashboard/SideBarComponent/navheader';

// export default function LogoutPage() {
//   const { authToken, csrfToken, logout } = useAuth();
//   const router = useRouter();

//   useEffect(() => {
//     const performLogout = async () => {
//       try {
//         await backendApi.post(
//           '/system_management/logout/',
//           {},
//           {
//             headers: {
//               Authorization: `Token ${authToken}`,
//               'X-CSRFToken': csrfToken,
//               'Content-Type': 'application/json',
//             },
//             withCredentials: true,
//           }
//         );
//       } catch (err) {
//         console.error('Logout failed:', err);
//       } finally {
//         logout();
//         router.push('/');
//       }
//     };

//     performLogout();
//   }, [authToken, csrfToken, logout, router]);

//   return (
//     <div className="flex h-screen">
//       <Sidebar />
//       <div className="flex-1 flex flex-col">
//         <Navbar />
//         <main className="flex-1 flex items-center justify-center">
//           <p className="text-lg text-gray-600">Logging you out...</p>
//         </main>
//       </div>
//     </div>
//   );
// }
