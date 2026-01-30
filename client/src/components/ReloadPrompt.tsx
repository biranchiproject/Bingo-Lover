
import { useRegisterSW } from "virtual:pwa-register/react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export function ReloadPrompt() {
    const { toast } = useToast();
    const {
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            if (r) {
                console.log('SW Registered: ' + r)
            }
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    });

    useEffect(() => {
        if (needRefresh) {
            toast({
                title: "Update available",
                description: "A new version of the app is available.",
                action: (
                    <ToastAction
                        altText="Reload"
                        onClick={() => updateServiceWorker(true)}
                    >
                        Reload
                    </ToastAction>
                ),
                duration: Infinity, // Keep open until clicked
            });
        }
    }, [needRefresh, toast, updateServiceWorker]);

    return null;
}
