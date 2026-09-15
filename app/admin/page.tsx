import { getAllOrders } from "../lib/db";
import "./admin.css";
import AdminLogoutButton from "./AdminLogoutButton";

export const dynamic = "force-dynamic";

function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

function formatDate(iso: string): string {
  return new Date(iso + "Z").toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminPage() {
  const orders = getAllOrders();

  return (
    <main className="admin-main">
      <div className="shell">
        <div className="admin-header">
          <h1>Orders</h1>
          <AdminLogoutButton />
        </div>

        {orders.length === 0 ? (
          <p className="admin-empty">No orders yet.</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>State</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.first_name} {order.last_name}</td>
                    <td>{order.email}</td>
                    <td>{order.phone}</td>
                    <td>{order.address}</td>
                    <td>{order.state}</td>
                    <td>{order.tier_name} × {order.qty}</td>
                    <td>{formatNaira(order.amount_kobo)}</td>
                    <td>
                      <span className={`admin-badge ${order.paid ? "admin-badge--paid" : "admin-badge--unpaid"}`}>
                        {order.paid ? "Paid" : "Unpaid"}
                      </span>
                    </td>
                    <td>{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
