import {Octokit} from '@octokit/rest'


export interface ActivityReport {
    prs: {
        title: string;
        body: string;
        url: string;
        state: string;
        repo: string
    }[];
    commits: string[];
}


export async function fetchDailyActivity(
    pat: string,
    username: string,
    repos: string[]
):Promise<ActivityReport> {
    const octokit = new Octokit({ auth: pat});

    
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    const activities: ActivityReport = { prs: [], commits: []};

    for(const fullRepo of repos){
        const [owner, repo] = fullRepo.split('/');
        if(!owner || !repo) continue;

        try {
            // 1. Fetch Pull Request
            const {data: prs} = await octokit.rest.pulls.list({
                owner,
                repo,
                state: "all",
                sort: "updated",
                direction: "desc",
                per_page: 20
            });

            const userPRs = prs.filter((pr) => {
                const isAuthor = pr.user?.login.toLowerCase() === username.toLowerCase();
                const updated  = new Date(pr.updated_at);
                return isAuthor && updated >= startOfDay;
            });

            for(const pr of userPRs){
                activities.prs.push({
                    title: pr.title,
                    body: pr.body || "",
                    url: pr.html_url,
                    state: pr.merged_at ? "merged" : pr.state,
                    repo: fullRepo,
                });
                try {
                    const {data: prCommits} = await octokit.rest.pulls.listCommits({
                        owner,
                        repo,
                        pull_number: pr.number,
                        per_page: 100
                    });

                    for(const c of prCommits){
                        const isAuthor = c.author?.login?.toLowerCase() === username.toLowerCase() ||
                        c.commit.author?.name?.toLowerCase() === username.toLowerCase();
                        
                        // Capture commit messages
                        if(isAuthor && c.commit?.message){
                            // Extract just the first line of the commit message (clean subject)
                            const firstLine = c.commit.message.split("\n")[0].trim();
                            const commitEntry = `[${repo} #${pr.number}] ${firstLine}`;
                            if(!activities.commits.includes(commitEntry)){
                                activities.commits.push(commitEntry);
                            }
                        }
                    }
                } catch (prErr) {
                    console.warn(`Could not fetch commits for PR #${pr.number}:`, prErr);
                }
            }

            // 2. Fetch Commits by Author
            const {data: commits} = await octokit.rest.repos.listCommits({
                owner,
                repo,
                author: username,
                since: startOfDay.toISOString(),
            });

            for(const c of commits){
                activities.commits.push(`[${repo} ${c.commit.message}]`);
            }
        } catch (error) {
            console.error(`Error fetching activity for ${fullRepo}:`, error);
        }
    }
    return activities;
}