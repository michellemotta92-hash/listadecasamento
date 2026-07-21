export function GiftCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
      <div className="aspect-square bg-stone-100 animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-4 w-20 bg-stone-100 rounded animate-pulse" />
          <div className="h-4 w-16 bg-stone-100 rounded animate-pulse" />
        </div>
        <div className="h-5 w-3/4 bg-stone-100 rounded animate-pulse" />
        <div className="h-6 w-1/3 bg-stone-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function GiftDetailSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="h-6 w-24 bg-stone-100 rounded animate-pulse mb-8" />
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-stone-100 rounded-2xl animate-pulse" />
        <div className="space-y-4">
          <div className="h-4 w-24 bg-stone-100 rounded animate-pulse" />
          <div className="h-8 w-3/4 bg-stone-100 rounded animate-pulse" />
          <div className="h-10 w-1/3 bg-stone-100 rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-full bg-stone-100 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-stone-100 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-stone-100 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessageCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-32 bg-stone-100 rounded animate-pulse" />
        <div className="h-4 w-20 bg-stone-100 rounded animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-stone-100 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-stone-100 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function AdminTableRowSkeleton() {
  return (
    <tr>
      <td className="px-4 py-3"><div className="h-5 w-5 bg-stone-100 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-5 w-32 bg-stone-100 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-5 w-48 bg-stone-100 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-5 w-20 bg-stone-100 rounded animate-pulse" /></td>
      <td className="px-4 py-3"><div className="h-5 w-24 bg-stone-100 rounded animate-pulse" /></td>
    </tr>
  );
}