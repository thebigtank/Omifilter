"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { POD_STATUSES, POD_STATUS_LABELS, type PodStatus } from "../lib/payment";

export default function PodStatusSelect({
  reference,
  status,
}: {
  reference: string;
  status: PodStatus;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  async function change(next: PodStatus) {
    const previous = value;
    setValue(next);
    setSaving(true);
    setFailed(false);
    try {
      const res = await fetch("/api/admin/orders/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference, status: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setValue(previous);
      setFailed(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <span className="admin-pod-status">
      <select
        className={`admin-pod-status__select admin-pod-status__select--${value}`}
        value={value}
        disabled={saving}
        aria-label={`Status for order ${reference}`}
        onChange={(e) => change(e.target.value as PodStatus)}
      >
        {POD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {POD_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {failed && <span className="admin-pod-status__error">Not saved</span>}
    </span>
  );
}
