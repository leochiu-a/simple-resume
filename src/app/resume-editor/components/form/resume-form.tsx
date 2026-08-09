import Information from "./information";
import SocialLinks from "./social-links";
import Skills from "./skills";
import Educations from "./educations";
import EmploymentHistory from "./employment-history";
import Profile from "./profile";
import Projects from "./projects";

const ResumeForm = () => {
  return (
    <div>
      <Information />
      <Profile />
      <SocialLinks />
      <Skills />
      <EmploymentHistory />
      <Projects />
      <Educations />
    </div>
  );
};

export default ResumeForm;
