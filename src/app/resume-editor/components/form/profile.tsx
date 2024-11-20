import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { useFormContext } from "react-hook-form";

const Profile = () => {
  const { register } = useFormContext();

  return (
    <>
      <Typography variant="h4">Profile</Typography>
      <div className="mb-8 mt-4 space-y-4">
        <Textarea
          {...register("profile")}
          rows={5}
          className="field-sizing-content"
        />
      </div>
    </>
  );
};

export default Profile;
