import { motion } from "framer-motion";
import MachineTimeline from "./source/MachineTimeline";

const SourcePage = () => {
  return (
    <motion.div 
      className="w-full min-h-screen space-y-4 p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <MachineTimeline />
    </motion.div>
  );
};

export default SourcePage;
