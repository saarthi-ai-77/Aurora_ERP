"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl border w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function AlertDialogContent({ children }: { children: React.ReactNode }) {
  return <div className="p-6 space-y-4">{children}</div>;
}

export function AlertDialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>;
}

export function AlertDialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-gray-900">{children}</h2>;
}

export function AlertDialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-gray-500 leading-relaxed">{children}</p>;
}

export function AlertDialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-2">{children}</div>;
}

export function AlertDialogCancel({ children, onClick }: { children: React.ReactNode; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick} 
      className="mt-2 sm:mt-0"
    >
      {children}
    </Button>
  );
}

export function AlertDialogAction({ children, onClick, className }: { children: React.ReactNode; onClick?: (e: React.MouseEvent) => void; className?: string }) {
  return (
    <Button 
      onClick={onClick} 
      className={cn("bg-red-600 hover:bg-red-700 text-white", className)}
    >
      {children}
    </Button>
  );
}
